import { Browser, Locator, Page, chromium } from "playwright-core";
import { readFileSync, writeFileSync } from "fs";

import { Config, Data } from "./types";

async function main() {
    const url = "https://vpn.inf.shizuoka.ac.jp/dana-na/auth/url_3/welcome.cgi";
    const config = get_config();

    const browser = await launch_browser();
    const page = await browser.newPage();

    await page.goto(url);
    await enter(page, config.user_name, config.password);
    await cd(page, config.target);
    const map = await get_data(page);

    await browser.close();

    printAll(map, "output.csv");

    return;
}

// config.jsonを読み込む
function get_config(): Config {
    const str = readFileSync("./config.json").toString();
    return JSON.parse(str) as Config;
}

// ブラウザを起動する
async function launch_browser(): Promise<Browser> {
    return await chromium.launch({
        channel: "chrome",
        headless: false,
    });
}

// shareまで移動する
async function enter(page: Page, user_name: string, password: string) {
    await page.getByRole("textbox", { name: "username" }).fill(user_name);
    await page.getByRole("textbox", { name: "password" }).fill(password);
    await page.locator("#btnSubmit_6").click();
    await page.locator("#file_bookmark_card_0").click();
}

// 対象ディレクトリまで移動する
async function cd(page: Page, target: string) {
    const dir_names = target.split("/");

    for (const dir_name of dir_names) {
        // 正規表現で完全一致
        await page.getByRole('link', { name: dir_name, exact: true }).click();
    }
}

async function get_data(page: Page): Promise<Map<string, Data>> {
    await page.locator("#file_list_table-tableRow-0").hover();

    const map = new Map<string, Data>();
    let last_length = 0;

    do {
        last_length = map.size;

        const rows = page.locator(".psui-table__row");
        for (const row of await rows.all()) {
            const row_id = await row.getAttribute("id");
            const index = row_id?.match(/\d+$/)?.[0];
            if (index !== undefined) {
                if (!map.has(index)) {
                    const [name, ext] = await get_file_name(row, index);
                    const size = await get_size(row, index);
                    const date = await get_date(row, index);

                    const data = {
                        name: name,
                        ext: ext,
                        size: size,
                        date: date,
                    };

                    map.set(index, data);
                }
            }
        }

        await page.mouse.wheel(0, 640);
        await sleep(500);
    } while (last_length < map.size);

    return map;
}

async function sleep(ms: number): Promise<number> {
    return new Promise((res) => setTimeout(res, ms));
}

async function get_file_name(row: Locator, index: string): Promise<[string, string]> {
    const text = await row
        .locator(`#file_list_table-tableRow-cell_${index}_name`)
        .textContent();
    const split = text?.split(".") ?? ["ERROR", "ERROR"];
    return [split[0], split[1]];
}

async function get_size(row: Locator, index: string): Promise<string> {
    const size = await row
        .locator(`#file_list_table-tableRow-cell_${index}_size`)
        .textContent();

    return size?.trim() ?? "ERROR";
}

async function get_date(row: Locator, index: string): Promise<string> {
    const date = await row
        .locator(`#file_list_table-tableRow-cell_${index}_timestamp`)
        .textContent();

    return date?.trim() ?? "ERROR";
}

function printAll(map: Map<string, Data>, filename: string) {
    const arr = [];
    for (const [index, data] of map.entries()) {
        arr.push(`${index},${data.name},${data.ext},${data.size},${data.date}`);
    }

    const csv_str = arr.join("\n");
    writeFileSync(filename, csv_str);
}

main().then(() => {
    console.log("complete");
    console.log("data => output.csv");
});
