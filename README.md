# 噜妹的练声室
[打开练习网站](https://xiaoluyier.github.io/lulu-diction/)

法语、意大利语歌词朗读手帖。选择曲目后可进入逐词、逐句或录音纠正；不分析歌唱音高。页面和练习进度独立于英语学习网站。

## 导入
粘贴纯文本，无上传，不调用 AI。第一行歌名，第二行语言（it 或 fr），第三行空行，从第四行起每行一句。

```text
歌名：Caro mio ben
语言：it

Caro mio ben,
credimi almen,
senza di te
languisce il cor.
```

浏览器在当前设备保存曲目、复听提醒和小目标。录音只在本次评测视图保留，切页释放。清除站点数据会清空进度。

## 声音与纠音
- 示范优先使用系统同语种的语音。没有相应声音时使用随站提供的 eSpeak NG。自动音标按词典和读音规则推算，多音词仍需结合语境。
- 默认在浏览器按需加载 Vosk 小模型（法语约 42 MB，意大利语约 50 MB）。自由转写与目标文本对齐，只能提示辨读差异。相同的转写不代表发音正确。录音不离开设备。
- 设置可启用 Azure Speech 专业朗读评测。将选中一句或一词的 16kHz PCM 录音及原文发到指定区域；保留词级匹配证据。法语和意大利语不提供实际发出的音素名称。
- DeepSeek 仅接收目标文本和有证据的问题，返回练法，不编造音素诊断。公开静态站可输入使用者自己的密钥（仅保存在页面内存）；不填仍有程序生成的基础练法。
- 词和句两份待复听队列独立。播放完成才清除对应项；关闭列表、切歌、打断或播放失败不清除。新的问题可重新提醒。

## 本地与发布
需要 Node.js 22+。运行 `npm start`，然后打开 http://127.0.0.1:4387 。本地服务只绑定回环地址。可从私有环境提供 DEEPSEEK_API_KEY、DEEPSEEK_BASE_URL、DEEPSEEK_MODEL；密钥不出现在响应中。可以通过 Node 的 --env-file 使用现有本机配置，另设 PORT 可覆盖端口。不要将 .env 发布至 GitHub。

`npm test` 运行状态与解析测试。静态站位于 site，含已构建资源，无需构建即可托管。GitHub Pages 从 gh-pages 分支根目录发布。维护者使用 `git subtree split --prefix site -b <新分支>` 后将该分支推送至 gh-pages 即可更新。

重建资源：npm ci；node tools/assets.mjs；python tools/models.py（requests）；python tools/lumei.py（Pillow，重建封面时需 Georgia 字体）。语音组件与模型来源见 site/NOTICE.txt。

