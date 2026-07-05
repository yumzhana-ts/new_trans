#!/bin/sh
set -e

ELASTIC_URL="http://elasticsearch:9200"
KIBANA_URL="http://kibana:5601/kibana"

ELASTIC_AUTH="elastic:${ELASTIC_PASSWORD}"
KIBANA_AUTH="elastic:${ELASTIC_PASSWORD}"

# -------------------------
# LOG HELPERS
# -------------------------
status() {
  echo ""
  echo "===================================="
  echo "👉 $1"
  echo "===================================="
}

ok() {
  echo "✅ $1"
}

fail() {
  echo "❌ $1"
  exit 1
}

pretty() {
  echo "$1"

  if echo "$1" | grep -q '"created":false'; then
    echo "⚡ already exists (skipped creation)"
  elif echo "$1" | grep -q '"created":true'; then
    echo "🎉 created successfully"
  elif echo "$1" | grep -q "error"; then
    echo "❌ error detected"
  fi
}

retry() {
  max=$1
  shift
  delay=2
  attempt=1

  until "$@"; do
    if [ "$attempt" -ge "$max" ]; then
      fail "FAILED after $attempt attempts"
    fi

    echo "⏳ retry $attempt (sleep ${delay}s)"
    sleep "$delay"

    attempt=$((attempt + 1))
    delay=$((delay * 2))
  done
}

# -------------------------
# CHECKS
# -------------------------
es_ready() {
  curl -s "$ELASTIC_URL/_cluster/health" >/dev/null
}

es_security_ready() {
  curl -s -u "$ELASTIC_AUTH" "$ELASTIC_URL/_security/_authenticate" >/dev/null 2>&1
}

kibana_ready() {
  curl -s "$KIBANA_URL/api/status" | grep -q '"level":"available"'
}

# -------------------------
# START
# -------------------------
status "WAITING FOR ELASTICSEARCH"
retry 40 es_ready
ok "Elasticsearch HTTP ready"

status "WAITING FOR SECURITY"
retry 30 es_security_ready
ok "Security subsystem ready"

# -------------------------
# SECURITY
# -------------------------
status "CREATING ROLE"
if ! ROLE_RESULT=$(curl -f -s -u "$ELASTIC_AUTH" -X PUT \
"$ELASTIC_URL/_security/role/write_events" \
-H "Content-Type: application/json" \
-d '{
  "cluster": ["monitor","manage_index_templates"],
  "indices": [{
    "names": ["events-*"],
    "privileges": ["write","create","create_index","auto_configure","manage"]
  }]
}'); then
    fail "Failed to create write_events role"
  fi
ok "Role processed"

status "CREATING LOGSTASH USER"
USER_RESULT=$(curl -s -u "$ELASTIC_AUTH" -X PUT \
"$ELASTIC_URL/_security/user/logstash_writer" \
-H "Content-Type: application/json" \
-d "{
  \"password\": \"${LOGSTASH_PASSWORD}\",
  \"roles\": [\"write_events\"]
}")

pretty "$USER_RESULT"
ok "Logstash user processed"

status "SETTING KIBANA PASSWORD"
PASS_RESULT=$(curl -s -u "$ELASTIC_AUTH" -X POST \
"$ELASTIC_URL/_security/user/kibana_system/_password" \
-H "Content-Type: application/json" \
-d "{
  \"password\": \"${KIBANA_PASSWORD}\"
}")

echo "$PASS_RESULT"
echo "🔐 Kibana password updated"

# -------------------------
# ILM
# -------------------------
status "CREATING ILM POLICY"
ILM_RESULT=$(curl -s -u "$ELASTIC_AUTH" -X PUT \
"$ELASTIC_URL/_ilm/policy/events_policy" \
-H "Content-Type: application/json" \
-d '{
  "policy": {
    "phases": {
      "hot": { "actions": {} },
      "delete": {
        "min_age": "10m",
        "actions": { "delete": {} }
      }
    }
  }
}')

echo "$ILM_RESULT"
ok "ILM policy ready"

status "CREATING INDEX TEMPLATE"
TEMPLATE_RESULT=$(curl -s -u "$ELASTIC_AUTH" -X PUT \
"$ELASTIC_URL/_index_template/events_template" \
-H "Content-Type: application/json" \
-d '{
  "index_patterns": ["events-*"],
  "template": {
    "settings": {
      "index.lifecycle.name": "events_policy"
    },
    "mappings": {
      "dynamic": true
    }
  }
}')

echo "$TEMPLATE_RESULT"
ok "Index template ready"

# -------------------------
# KIBANA
# -------------------------
status "WAITING FOR KIBANA"
retry 60 kibana_ready
ok "Kibana ready"

# -------------------------
# DASHBOARD
# -------------------------
status "IMPORTING DASHBOARD"

DASH_RESULT=$(curl -s -u "$KIBANA_AUTH" -X POST \
"$KIBANA_URL/api/saved_objects/_import?overwrite=true" \
-H "kbn-xsrf: true" \
--form file=@/init/kibana-dashboard.ndjson)

echo "$DASH_RESULT"

if echo "$DASH_RESULT" | grep -q "403"; then
  echo "⚠️ Forbidden: Kibana not ready for saved objects OR missing permissions"
  fail "Dashboard import failed"
elif echo "$DASH_RESULT" | grep -q "error"; then
  fail "Dashboard import failed"
else
  echo "🎉 Dashboard imported successfully"
fi

ok "Dashboard step completed"

# -------------------------
# DONE
# -------------------------
status "BOOTSTRAP COMPLETE"
ok "ALL SYSTEMS READY 🚀"


# -------------------------
# TEST
# -------------------------

#curl http://localhost:9200/_cluster/health
#curl -k https://localhost:8443/kibana/api/saved_objects

