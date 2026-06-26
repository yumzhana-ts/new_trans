#!/bin/sh

echo "Waiting for Grafana..."

until curl -s http://grafana:3000/api/health; do
  sleep 2
done

echo "Grafana is ready"

sh /setup.sh