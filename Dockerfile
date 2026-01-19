FROM ruby:3.1-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends build-essential git \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /srv/jekyll

# Install gems first (leverages Docker layer caching)
COPY Gemfile ./
RUN gem install bundler -v 2.3.25 \
  && bundle config set path /usr/local/bundle \
  && bundle install

EXPOSE 4000

CMD ["bundle", "exec", "jekyll", "serve", "--host", "0.0.0.0", "--force_polling", "--baseurl", ""]
