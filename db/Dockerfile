FROM postgres:16

RUN apt-get update \
    && apt-get install -y --no-install-recommends postgresql-16-cron postgresql-16-partman \
    && rm -rf /var/lib/apt/lists/*

RUN echo "shared_preload_libraries = 'pg_cron'" >> /usr/share/postgresql/postgresql.conf.sample \
    && echo "cron.database_name = 'gps_tracker'" >> /usr/share/postgresql/postgresql.conf.sample

EXPOSE 5432