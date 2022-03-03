"use strict";
// ----------------------------------------------------------------------------------//
// TWEETR
// Tumblr posting bot (( BETA v0.1.0 ))
// Fiigmnt | Febuary 9, 2022 | Updated:
// ----------------------------------------------------------------------------------//
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@notionhq/client");
const twitter_api_v2_1 = require("twitter-api-v2");
const node_fetch_1 = __importDefault(require("node-fetch"));
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const https_1 = __importDefault(require("https"));
dotenv_1.default.config();
const { NOTION_TOKEN, NOTION_DB: databaseId, TWITTER_APP_KEY, TWITTER_APP_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET, TUMBLR_TOKEN, } = process.env;
const notion = new client_1.Client({
    auth: NOTION_TOKEN,
});
// OAuth 1.0a (User context)
const twitterClient = new twitter_api_v2_1.TwitterApi({
    appKey: TWITTER_APP_KEY || "",
    appSecret: TWITTER_APP_SECRET || "",
    accessToken: TWITTER_ACCESS_TOKEN || "",
    accessSecret: TWITTER_ACCESS_SECRET || "",
});
const rand = (min, max) => {
    return Math.floor(Math.random() * (max - min)) + min;
};
const checkNotionId = (rowId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!databaseId) {
        console.log("No Database Connection!");
        return;
    }
    try {
        const response = yield notion.databases.query({
            database_id: databaseId,
            filter: {
                property: "id",
                title: {
                    equals: rowId,
                },
            },
        });
        return response.results.length > 0;
    }
    catch (error) {
        console.error(`Notion Error: ${error}`);
    }
});
const addPostToNotion = (tweet) => __awaiter(void 0, void 0, void 0, function* () {
    if (!databaseId) {
        console.log("No Database Connection!");
        return;
    }
    try {
        yield notion.pages.create({
            parent: { database_id: databaseId },
            properties: {
                id: {
                    title: [
                        {
                            text: {
                                content: tweet.id,
                            },
                        },
                    ],
                },
                "media-id": {
                    rich_text: [
                        {
                            text: {
                                content: tweet.mediaId,
                            },
                        },
                    ],
                },
                url: {
                    url: tweet.url,
                },
                date: {
                    date: {
                        start: new Date().toISOString(),
                    },
                },
            },
        });
        console.log(`---------- ENTRY ADDED -----------`);
    }
    catch (error) {
        console.error(error);
    }
});
const getRequestString = (pageNumber = null) => {
    if (pageNumber) {
        return `https://api.tumblr.com/v2/blog/0xmirage/posts?fields%5Bblogs%5D=name%2Cavatar%2Ctitle%2Curl%2Cis_adult%2C%3Fis_member%2Cdescription_npf%2Cuuid%2Ccan_be_followed%2C%3Ffollowed%2C%3Fadvertiser_name%2Ctheme%2C%3Fprimary%2C%3Fis_paywall_on%2C%3Fpaywall_access%2C%3Fsubscription_plan%2Cshare_likes%2Cshare_following%2Ccan_subscribe%2Csubscribed%2Cask%2C%3Fcan_submit%2C%3Fis_blocked_from_primary%2C%3Fis_blogless_advertiser%2C%3Ftweet%2Cupdated%2Cfirst_post_timestamp%2Cposts%2Cdescription%2C%3Ftop_tags_all&npf=true&reblog_info=true&tumblelog=0xmirage&page_number=${pageNumber}`;
    }
    return "https://api.tumblr.com/v2/blog/0xmirage/posts?fields%5Bblogs%5D=name%2Cavatar%2Ctitle%2Curl%2Cis_adult%2C%3Fis_member%2Cdescription_npf%2Cuuid%2Ccan_be_followed%2C%3Ffollowed%2C%3Fadvertiser_name%2Ctheme%2C%3Fprimary%2C%3Fis_paywall_on%2C%3Fpaywall_access%2C%3Fsubscription_plan%2Cshare_likes%2Cshare_following%2Ccan_subscribe%2Csubscribed%2Cask%2C%3Fcan_submit%2C%3Fis_blocked_from_primary%2C%3Fis_blogless_advertiser%2C%3Ftweet%2Cupdated%2Cfirst_post_timestamp%2Cposts%2Cdescription%2C%3Ftop_tags_all&npf=true&reblog_info=true";
};
const fetchTumblrPosts = (pageNumber = null) => __awaiter(void 0, void 0, void 0, function* () {
    return (yield (yield (0, node_fetch_1.default)(getRequestString(pageNumber), {
        headers: {
            accept: "application/json;format=camelcase",
            "accept-language": "en-us",
            authorization: `Bearer ${TUMBLR_TOKEN}`,
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site",
            "sec-gpc": "1",
            "x-ad-blocker-enabled": "1",
            "x-is-blog-network": "1",
            "x-version": "redpop/3/0//redpop/",
            cookie: "tmgioct=62044394f2e9270993792200",
            Referer: "https://0xmirage.tumblr.com/",
            "Referrer-Policy": "strict-origin-when-cross-origin",
        },
        method: "GET",
    })).json()).response;
});
const getAllTumblrPosts = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g;
    const initialResult = yield fetchTumblrPosts();
    let posts = initialResult.posts;
    let pageNumber = (_c = (_b = (_a = initialResult.links) === null || _a === void 0 ? void 0 : _a.next) === null || _b === void 0 ? void 0 : _b.queryParams) === null || _c === void 0 ? void 0 : _c.pageNumber;
    for (let i = 0; i < 5; i++) {
        if (pageNumber) {
            const nextResult = yield fetchTumblrPosts(pageNumber);
            pageNumber = (_f = (_e = (_d = nextResult.links) === null || _d === void 0 ? void 0 : _d.next) === null || _e === void 0 ? void 0 : _e.queryParams) === null || _f === void 0 ? void 0 : _f.pageNumber;
            posts = posts.concat(nextResult.posts);
            i = 0;
        }
    }
    let media = [];
    for (const post of posts) {
        const content = (_g = post === null || post === void 0 ? void 0 : post.trail[0]) === null || _g === void 0 ? void 0 : _g.content;
        if (content) {
            for (let i = 0; i < content.length; i++) {
                if (content[i].type === "image") {
                    const url = content[i].media[0].url;
                    media.push({
                        id: getIdFromUrl(url),
                        type: getTypeFromUrl(url),
                        url,
                    });
                }
            }
        }
    }
    return media;
});
const findUniquePost = (posts) => __awaiter(void 0, void 0, void 0, function* () {
    let postFound = true;
    let post = posts[rand(0, posts.length - 1)];
    while (postFound) {
        postFound = yield checkNotionId(post.id);
        post = posts[rand(0, posts.length - 1)];
    }
    return post;
});
const getIdFromUrl = (url) => {
    return url
        .substring(url.indexOf("com/") + 4)
        .substring(0, url.substring(url.indexOf("com/") + 4).indexOf("/"));
};
const getTypeFromUrl = (url) => {
    return url
        .substring(url.indexOf("com/") + 4)
        .substring(url.substring(url.indexOf("com/") + 4).indexOf(".") + 1);
};
const downloadFile = (post) => __awaiter(void 0, void 0, void 0, function* () {
    // URL of the image
    const url = post.url;
    const fileName = `${post.id}.${post.type}`;
    const path = `${__dirname}/../files/${fileName}`;
    try {
        const filePath = yield new Promise((resolve, reject) => {
            https_1.default.get(url, (res) => {
                // Image will be stored at this path
                const filePath = fs_1.default.createWriteStream(path);
                res.pipe(filePath);
                filePath.on("finish", () => {
                    filePath.close();
                    console.log(`:: Downloaded ${fileName} ::`);
                    resolve(path);
                });
            });
        });
        return filePath;
    }
    catch (error) {
        throw new Error(`File download error: ${error}`);
    }
});
const run = () => __awaiter(void 0, void 0, void 0, function* () {
    // Grab all posts from tumblr
    const posts = yield getAllTumblrPosts();
    // find an unused post
    const post = yield findUniquePost(posts);
    // download that file
    const filePath = yield downloadFile(post);
    console.log(filePath);
    // tweet that shit out
    const mediaId = yield twitterClient.v1.uploadMedia(filePath);
    console.log(mediaId);
    const tweetResponse = yield twitterClient.v2.tweet({
        media: { media_ids: [mediaId] },
    });
    // update notion
    if (tweetResponse) {
        const tweet = {
            id: post.id,
            mediaId,
            url: tweetResponse.data.text,
        };
        console.log(tweet);
        yield addPostToNotion(tweet);
    }
});
run();
