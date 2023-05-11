export const sliderHtml = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="renderer" content="webkit" />
  <meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no" />
  <title>滑条验证码</title>
</head>
<body>
<div id="cap_iframe" style="width: 100%; height: 100%"/>
<!--suppress JSUnresolvedReference -->
<script type="text/javascript">
  (() => {
    const queryString = window.location.search.substring(1);
    const queries = new URLSearchParams(queryString);
    const scriptElement = document.createElement("script");
    scriptElement.onload = () => {
      capInit(document.getElementById("cap_iframe"), {
        callback: async ({ ticket }) => {
          await fetch("/oicq/slider", {
            headers: {
              "Content-Type": "application/json"
            },
            method: "POST",
            body: JSON.stringify({
              account: queries.get("account"),
              ticket: ticket
            })
          });
          window.close();
        },
        showHeader: false
      });
    };
    scriptElement.src = "https://captcha.qq.com/template/TCapIframeApi.js?" + queryString;
    scriptElement.type = "text/javascript";
    document.head.appendChild(scriptElement);
  })();
</script>
</body>
</html>
`.trim();
