FROM curlimages/curl:latest

WORKDIR /app

COPY entrypoint.sh /entrypoint.sh
COPY setup.sh /setup.sh
COPY dashboards /dashboards

ENTRYPOINT ["/entrypoint.sh"]