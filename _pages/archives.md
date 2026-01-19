---
layout: page
title: Archives
permalink: /archives
---

{% assign posts_by_year = site.posts | group_by_exp: "post", "post.date | date: '%Y'" %}

{% for year in posts_by_year %}
<h3 id="y{{ year.name }}">{{ year.name }}</h3>
<ul class="list-unstyled">
  {% for post in year.items %}
    <li class="mb-1">
      <span class="text-muted">{{ post.date | date: "%b %d" }}</span>
      <a href="{{ site.baseurl }}{{ post.url }}">{{ post.title }}</a>
    </li>
  {% endfor %}
</ul>
{% endfor %}
