import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import * as fs from 'fs';

async function fetchHTML(url) {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    //  "Referer": url,
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "zh-CN,zh;q=0.9"
    },
    credentials: "include",
    mode: "cors",
  });
  return await response.text();
}

function formatText(text) {
  return text.replace(/\n|\t/g, "");
}

async function cpuInfoList() {
  const baseURL = "https://www.techpowerup.com/cpu-specs/";

  const response = await fetchHTML(`${baseURL}?sort=released&mfgr=Intel&generation=Intel Core i5`);
  const $ = cheerio.load(await response);

  const processors = [];
  $("table.processors > tbody > tr").each((index, element) => {
    const td_list = $(element).children();
    processors.push({
      name: $(td_list[0]).children("a").text(),
      codename: $(td_list[1]).text(),
      cores: $(td_list[2]).text(),
      frequency: $(td_list[3]).text(),
    });
  });

  console.log(processors);
}

const processors = [];

async function benchmarkList() {
  const baseURL = "https://browser.geekbench.com/processor-benchmarks";

  const response = await fetchHTML(baseURL);
  const $ = cheerio.load(await response);

  $("table.benchmark-chart-table > tbody > tr").each((index, element) => {
    const td_list = $(element).children();
    processors.push({
      name: formatText($(td_list[0]).children("a").text()),
      score: formatText($(td_list[1]).text()),
    });
  });
}


async function JDprice() {
  const baseURL = "https://search.jd.com/search";

  async function eachProduct(index) {
    // filter: cpu
    const response = await fetchHTML(`${baseURL}?keyword=${processors[index].name} 京东自营&cid3=678`);
    const $ = cheerio.load(await response);

    // use the first product price
    processors[index].price = formatText($("div.p-price > strong").first().text());
    console.log(processors[index]);

    setTimeout(() => {
      if (index < processors.length - 1) {
        eachProduct(index + 1);
      }
    }, 500);
  }

  eachProduct(0);
}

async function sort() {
  // read data from file
  const data = fs.readFileSync("./data.json", "utf-8");
  const processors = JSON.parse(data);
  for (const processor of processors) {
    processor.score = parseInt(processor.score);
    processor.price = parseInt(processor.price);

    processor.cp_ratio = processor.score / processor.price;
  }
  // sort by cp_ratio
  processors.sort((a, b) => {
    return b.cp_ratio - a.cp_ratio;
  });
  // output top 10
  console.log(processors.slice(0, 10));
}


async function main() {
  await benchmarkList();
  await JDprice();
}

sort();
