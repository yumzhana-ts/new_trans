#!/bin/sh

echo "Creating Prometheus datasource..."

curl -X POST http://admin:${GRAFANA_ADMIN_PASSWORD}@grafana:3000/api/datasources \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Prometheus",
    "type": "prometheus",
    "url": "http://prometheus:9090",
    "access": "proxy",
    "isDefault": true
  }'

echo "Prometheus datasource created"

echo "Creating dashboard..."

curl -X POST http://admin:${GRAFANA_ADMIN_PASSWORD}@grafana:3000/api/dashboards/db \
  -H "Content-Type: application/json" \
  -d '{
    "dashboard": {
      "id": null,
      "title": "System Overview",
      "panels": [
        {
          "type": "timeseries",
          "title": "Service UP status",
          "targets": [
            {
              "expr": "up"
            }
          ]
        }
      ],
      "schemaVersion": 38,
      "version": 1
    },
    "overwrite": true
  }'

echo "Dashboard created"

echo "Importing nodejs dashboard..."

curl -s -X POST "http://admin:${GRAFANA_ADMIN_PASSWORD}@grafana:3000/api/dashboards/db" \
  -H "Content-Type: application/json" \
  -d @/dashboards/nodejs-dashboard.json

echo "NodeJS dashboard imported"

echo "Done"