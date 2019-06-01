#!/bin/bash
#	index.sh
source 'script/select.sh'

INITIAL_VERSION="1.0.0"
STEP=1
version_options=(
  "major"
  "minor"
  "bugfix"
)

function TRAP_ANY_ERROR() {
  exit 1
}

# color output helper function
function COLOR() {
  local color_code=$1
  local str="$2"

  printf "\033[%dm%s\033[0m" $color_code "$str"
}

function get_next_version() {
  # 如果 subshell 用于初始化一个 local 变量，那么这个 subshell 的 exit code 会被 local 命令吞掉
  # 单独定义和赋值就没这个问题
  local current_version
  current_version=$(git describe --tag --abbrev=0 2>/dev/null)

  if [ $? != 0 ]; then
    printf "\033[32mThe repository has not been tagged before, \
use \033[33m%s\033[32m instead\033[0m\n" $INITIAL_VERSION
    export RELEASE_VERSION=$INITIAL_VERSION
    return 0
  fi

  local meta_version=(${current_version//./ })
  local meta_major=${meta_version[0]}
  local meta_minor=${meta_version[1]}
  local meta_bugfix=${meta_version[2]}

  # # dignosis
  # for part in ${meta_version[@]}; do
  #   echo $part
  # done
  create_selection "release type" ${version_options[@]}
  # printf "\033[32m[release type]: \033[33m%s\033[0m\n" ${version_options[$SELECTED]}
  case $SELECTED in
  "0")
    meta_major=$((meta_major + 1))
    ;;
  "1")
    meta_minor=$((meta_minor + 1))
    ;;
  "2")
    meta_bugfix=$((meta_bugfix + 1))
    ;;
  esac
  # export version to env variable
  export RELEASE_VERSION="$meta_major.$meta_minor.$meta_bugfix"
}

function check_out_dev() {
  # check if we are on develop branch
  current_branch_name=$(git rev-parse --abbrev-ref HEAD)
  if [ $current_branch_name != 'develop' ]; then
    # check the dirty state
    git diff-index --quiet HEAD
    if [ $? != 0 ]; then
      printf "%s\n" "$(COLOR 31 'The working tree is dirty, please commit or reset first')"
      exit 1
    fi

    # git checkout develop
    git checkout develop
    last_exit_code=$?
    if [ $last_exit_code != 0]; then
      exit $last_exit_code
    fi
  fi
}

function build_release() {
  # create a release branch
  release_branch_name="release/${RELEASE_VERSION}"
  git checkout -b $release_branch_name

  # build project
  printf "%s %s\n" "$(COLOR 90 [\#$STEP])" "$(COLOR 32 'build bundle')"
  ((STEP++))
  yarn build

  # add, commit
  git add .
  git commit -m "feat: release build commit"

  export RELEASE_BRANCH_NAME=$release_branch_name
}

function on_tag_error() {
  # delete release branch
  git branch -d $RELEASE_BRANCH_NAME
  # delete tag
  git tag -d $RELEASE_VERSION 2>/dev/null
}

function tag_and_push() {
  # bailout on any error
  # trap TRAP_ANY_ERROR ERR
  git checkout master

  # merge release branch
  git merge --no-ff $RELEASE_BRANCH_NAME
  if [ $? != 0 ]; then
    printf "%s\n" "$(COLOR 31 'merge release branch failed, resolve the conflict and run `yarn release` again')"
    return 1
  fi

  # tag and push
  git tag -a $RELEASE_VERSION
  printf "%s %s\n" "$(COLOR 90 [\#$STEP])" "$(COLOR 32 'push to master')"
  ((STEP++))
  git push
  printf "%s %s\n" "$(COLOR 90 [\#$STEP])" "$(COLOR 32 'push new version tag')"
  ((STEP++))
  git push origin $RELEASE_VERSION

  # post process
  git checkout develop
  git merge $RELEASE_VERSION # merge tag
  git branch -d $RELEASE_BRANCH_NAME
}

# check if release branch exists
printf "%s %s\n" "$(COLOR 90 [\#$STEP])" "$(COLOR 32 'check if its a rerunning')"
((STEP++))
release_branch=$(git branch --list | grep -Eo 'release/[0-9\.]+')
if [ $? = 0 ]; then
  # check dirty state
  git diff-index --quiet HEAD
  if [ $? != 0 ]; then
    printf "%s\n" "$(COLOR 31 'The working tree is dirty, please commit or reset first')"
    exit 1
  fi

  # trim the release part to get exact version number
  version_number=${release_branch#release/}

  # tag and push
  git tag -a $version_number
  printf "%s %s\n" "$(COLOR 90 [\#$STEP])" "$(COLOR 32 'push to master')"
  ((STEP++))
  git push
  printf "%s %s\n" "$(COLOR 90 [\#$STEP])" "$(COLOR 32 'push new version tag')"
  ((STEP++))
  git push origin $version_number

  # post process
  git checkout develop
  git merge $version_number # merge tag
  git branch -d $release_branch

  printf "%s %s\n" "$(COLOR 90 [\#$STEP])" "$(COLOR 32 'finish!')"
  exit 0
fi

printf "%s %s\n" "$(COLOR 90 [\#$STEP])" "$(COLOR 32 'generate version number')"
((STEP++))
get_next_version
printf "%s %s\n" "$(COLOR 32 '[generated version number]:')" "$(COLOR 31 $RELEASE_VERSION)"

printf "%s %s\n" "$(COLOR 90 [\#$STEP])" "$(COLOR 32 'switch to dev branch')"
((STEP++))
check_out_dev

printf "%s %s\n" "$(COLOR 90 [\#$STEP])" "$(COLOR 32 'create release branch and build')"
((STEP++))
build_release

printf "%s %s\n" "$(COLOR 90 [\#$STEP])" "$(COLOR 32 'tag version')"
((STEP++))
tag_and_push
