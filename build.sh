#!/bin/sh
# src 조각들을 index.html 한 파일로 합친다. 빌드 도구 없이 cat 하나로 끝난다.
cd "$(dirname "$0")"
{
  cat src/a_head.html src/b_body.html
  echo '<script>'
  echo '(() => {'
  echo "'use strict';"
  cat src/c_shader.js src/d_gl.js src/e_cast.js src/f_cam.js src/g_kitchen.js src/h_app.js
  echo '</script>'
  echo '</body>'
  echo '</html>'
} > index.html
echo "built index.html ($(wc -c < index.html) bytes)"
