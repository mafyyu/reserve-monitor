const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const { captureSchedule } = require("./src/index.ts");
const { fileDelete } = require("./src/delete.ts");

app.use('/data', express.static(path.join(__dirname, 'data')));

function formatName(file) {
  if (!file) return '未取得';
  const [date, time] = file.replace('.png', '').split('_');
  if (!date || !time) return file;
  const [y, m, d] = date.split('-');
  const [hh, mm] = time.split('-');

  return `${y}/${m}/${d} ${hh}:${mm}`;
}

app.get('/', (req, res) => {
  const files = fs
    .readdirSync('./data')
    .filter(f => f.endsWith('.png'))
    .sort()
    .reverse();
  const latest = files[0];

  res.send(`
  <meta http-equiv="refresh" content="300">
  <body style="margin:0;background:#white;color:#111;text-align:center;font-family:sans-serif">

    <h2>予約状況モニター</h2>
    <p>更新時間: ${formatName(latest)}</p>

    ${latest ? `<img src=/data/${latest} style="width:90%;border-radius:10px">` : '<p>まだ画像がありません</p>'}

  </body>
  `);
});

app.listen(3001, () => {
  console.log('Server listening on port 3001');
  cron.schedule('*/5 * * * *', ()=>captureSchedule(), fileDelete());
});
