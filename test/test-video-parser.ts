import { VideoParser } from '../src/video-parser';

async function main() {
  const parser = new VideoParser();

  // 抖音
  let res = await parser.parse(
    `0.79 Y@M.Wm 03/05 YzG:/ 新人报道# 新人第一天来到抖音 # 入驻抖音第一天  https://v.douyin.com/YRS5bBsKI_0/ 复制此链接，打开Dou音搜索，直接观看视频！`
  );
  console.log(res);

  // Pipixia
  let res2 = await parser.parse(`https://h5.pipix.com/s/hukXsy/`);
  console.log(res2);

  // 微博
  const headers = {
    cookie: process.env.cookie || '',
  };
  let res3 = await parser.parse(`https://weibo.com/tv/show/1034:4917848141721408`, headers);
  console.log(res3);
}

main();
