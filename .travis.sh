#!/bin/sh

# Bash function for doing things as part of Travis build
#
# Why? mostly because Travis deployment scripts need to be a
# a single command https://docs.travis-ci.com/user/deployment/script/

checkout_pages() {
  git config --global user.email $GIT_AUTHOR_EMAIL
  git config --global user.name $GIT_AUTHOR_NAME

  git remote add origin-pages https://${GITHUB_TOKEN}@github.com/${TRAVIS_REPO_SLUG}.git > /dev/null 2>&1
  git fetch --all
  git checkout --force gh-pages
  git branch --set-upstream-to origin-pages/gh-pages
  git reset --hard
}

push_pages() {
  git push --quiet
}

commit_docs() {
  git add -f --all docs
  git commit --message "$1"
}

deploy_typescript_docs_to_pages() {
  checkout_pages

  cp public/packages-index.html index.html
  git add index.html
  git commit --message "docs(Package index): Update"

  cd ts
  commit_docs "docs(Typescript): Update"

  push_pages
}

deploy_python_docs_to_pages() {
  checkout_pages
  commit_docs "docs(Python): Update"
  push_pages
}

deploy_r_docs_to_pages() {
  checkout_pages
  commit_docs "docs(R): Update"
  push_pages
}

# Call one of the functions as specified by the first arg
$1
