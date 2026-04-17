import type { Env } from "../env";

export interface NaverSearchResult {
  title: string;
  url: string;
  thumbnail: string;
  source: "naver_image" | "naver_blog";
}

interface NaverBlogItem {
  title?: string;
  link?: string;
  thumbnail?: string;
}

interface NaverImageItem {
  title?: string;
  link?: string;
  thumbnail?: string;
}

/**
 * Query Naver's blog and image search APIs in parallel and return combined
 * results. Images are returned first (they always have thumbnails); blog
 * items without thumbnails are filtered out.
 */
export async function naverSearch(
  env: Env,
  query: string,
  limit: number,
): Promise<NaverSearchResult[]> {
  const clientId = env.NAVER_CLIENT_ID;
  const clientSecret = env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) return [];

  const headers = {
    "X-Naver-Client-Id": clientId,
    "X-Naver-Client-Secret": clientSecret,
  };

  const imageResults: NaverSearchResult[] = [];
  const blogResults: NaverSearchResult[] = [];

  const [blogResp, imageResp] = await Promise.allSettled([
    fetch(
      `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(query)}&display=${limit}`,
      { headers },
    ),
    fetch(
      `https://openapi.naver.com/v1/search/image?query=${encodeURIComponent(query)}&display=${limit}`,
      { headers },
    ),
  ]);

  if (imageResp.status === "fulfilled" && imageResp.value.ok) {
    const data = (await imageResp.value.json()) as { items?: NaverImageItem[] };
    for (const item of data.items ?? []) {
      imageResults.push({
        title: item.title?.replace(/<[^>]+>/g, "") ?? "",
        url: item.link ?? "",
        thumbnail: item.thumbnail ?? item.link ?? "",
        source: "naver_image",
      });
    }
  }

  if (blogResp.status === "fulfilled" && blogResp.value.ok) {
    const data = (await blogResp.value.json()) as { items?: NaverBlogItem[] };
    for (const item of data.items ?? []) {
      if (!item.thumbnail) continue;
      blogResults.push({
        title: item.title?.replace(/<[^>]+>/g, "") ?? "",
        url: item.link ?? "",
        thumbnail: item.thumbnail,
        source: "naver_blog",
      });
    }
  }

  return [...imageResults, ...blogResults].slice(0, limit);
}
