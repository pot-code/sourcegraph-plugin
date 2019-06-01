#!/bin/bash
#	select-list.sh
# '[C')
#   echo "right arrow key"
#   ;;
# '[D')
#   echo "left arrow key"
#   ;;
# 捕获 INT 和 TERM 信号
trap restore_state INT TERM

function clear_list_render() {
  local list=("$@")
  local list_length=${#list[@]}

  printf "\033[%dA\033[J" $list_length
}

function hide_cursor() {
  tput civis
}

function show_cursor() {
  tput cnorm
}

function render_list() {
  local selected=$1
  shift
  local list=("$@")

  for i in ${!list[@]}; do
    if [ $i = $selected ]; then
      printf "\033[32m> %s\033[0m\n" ${list[$i]}
    else
      printf "  %s\n" ${list[$i]}
    fi
  done
}

function restore_state() {
  show_cursor
  exit 1
}

function question() {
  local ques="$1"

  # 用引号将 $ques 括起来就不会出现自动换行的情况了
  # 主要是因为 quote 机制，有 quote 的时候，整个值作为一个值。没有 quote 的时候
  # 如果值出现了空格的情况，会进行分割，分成多个参数
  printf "\033[32m? \033[90m%s\033[0m\n" "$ques"
}

# 创建提问-选择列表
# 对于参数包含数组的，将数组参数放在最后面，前面的参数处理后调用 shift，最后单独处理数组参数
function create_selection() {
  hide_cursor

  local ques="$1"
  shift
  local list=("$@")
  local selected=0
  local list_length=${#list[@]}

  question "$ques"
  render_list $selected ${list[@]}
  while true; do
    read -rsn1 keycode
    case $keycode in
    $'\x1B') # escaping sequence
      read -sn2 rest
      case $rest in
      '[A')
        if [ $selected -gt 0 ]; then
          selected=$((selected - 1))
          clear_list_render ${list[@]}
          render_list $selected ${list[@]}
        fi
        ;;
      '[B')
        if [ $selected -lt $(($list_length - 1)) ]; then
          selected=$((selected + 1))
          clear_list_render ${list[@]}
          render_list $selected ${list[@]}
        fi
        ;;
      esac
      ;;
    "") # Enter key
      break
      ;;
    'q')
      return 1
      ;;
    esac
  done

  show_cursor
  export SELECTED=$selected
  return 0
}
