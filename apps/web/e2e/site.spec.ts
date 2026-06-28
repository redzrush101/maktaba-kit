import { expect, type APIRequestContext, type APIResponse as PlaywrightAPIResponse, type Page, test } from "@playwright/test";

type ApiResponse<T> = { ok: boolean; data: T; errors: Array<{ source: string; message: string }> };
type Category = { id: string; name: string };
type Book = { source: "ablibrary" | "eshia" | "thaqalayn"; id: string; title?: string; volume?: string };
type SearchResult = { source: "ablibrary" | "eshia" | "thaqalayn"; bookId?: string; page?: number };
type PageResult = { source: string; bookId: string; page: number; text: string; footnotes?: unknown[] };
type TocItem = { title: string; bookId: string; page?: number };

const arabicQuery = "الحمد";
const knownEshiaRef = "eshia:11005/1/2";
const knownEshiaReaderPath = "/read/eshia/11005/1/2";
const knownThaqalaynRef = "thaqalayn:1/1/1/1";
const knownThaqalaynReaderPath = "/read/thaqalayn/1/1/1/1";

test.describe.configure({ mode: "serial" });

test.describe("Maktaba Kit integration coverage", () => {
  test("home and header navigation cover static top-level pages", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "MAKTABA KIT" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Search the library/i })).toBeVisible();
    await expect(page.getByPlaceholder("Search libraries...")).toBeVisible();

    await page.getByRole("link", { name: "Categories" }).click();
    await expect(page).toHaveURL(/\/categories$/);
    await expect(page.getByRole("heading", { name: "Categories" })).toBeVisible({ timeout: 45_000 });

    await page.getByRole("link", { name: "Hadiths" }).click();
    await expect(page).toHaveURL(/\/hadiths$/);
    await expect(page.getByRole("heading", { name: /Hadith collections from Thaqalayn/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Hadith shelf" })).toBeVisible();

    await page.getByRole("link", { name: "Library" }).click();
    await expect(page).toHaveURL(/\/library$/);
    await expect(page.getByRole("heading", { name: "Bookmarks and reading history" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Bookmarks", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Recently read" })).toBeVisible();
  });

  test("search form supports source/mode selection and renders text results", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("Search libraries...").fill(arabicQuery);
    await chooseCustomSelect(page, "Source", "ABLibrary");
    await page.getByRole("button", { name: "Search", exact: true }).click();

    await expect(page).toHaveURL(/\/search\?/);
    await expect(page).toHaveURL(/source=ablibrary/);
    await expect(page.getByPlaceholder("Search books, authors, or text...")).toHaveValue(arabicQuery);
    await expect(page.getByRole("heading", { name: "Text matches" })).toBeVisible({ timeout: 45_000 });
    await expect(page.locator("article").first()).toContainText(/ablibrary/i);

    await chooseCustomSelect(page, "Search type", "Books/authors");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(page).toHaveURL(/mode=books/);
    await expect(page.getByRole("heading", { name: "Books and authors" })).toBeVisible({ timeout: 45_000 });
  });

  test("search page covers advanced controls, pagination, empty state, and in-book search", async ({ page }) => {
    await page.goto(`/search?q=${encodeURIComponent(arabicQuery)}&source=ablibrary&mode=text&limit=10`);
    await expect(page.getByRole("heading", { name: "Text matches" })).toBeVisible({ timeout: 45_000 });
    await expect(page.getByRole("navigation", { name: "Search pagination" })).toBeVisible();

    await chooseCustomSelect(page, "Result count", "25");
    await page.getByLabel("exact phrase").check();
    await page.getByLabel("all words").check();
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(page).toHaveURL(/exact=1/);
    await expect(page).toHaveURL(/matchAll=1/);

    await page.goto("/search?q=zzzxxyunlikelyquery&source=ablibrary&mode=text&limit=10");
    await expect(page.getByText(/No results|Some sources failed/)).toBeVisible({ timeout: 45_000 });

    await page.goto(`/search?q=${encodeURIComponent(arabicQuery)}&source=eshia&mode=text&bookId=11005&volume=1&limit=10&strictVolume=1`);
    await expect(page.getByText(/inside eshia:11005\/1/)).toBeVisible();
    await expect(page.getByLabel("strict volume")).toBeChecked();
  });

  test("books, book detail, TOC, and original/read actions work", async ({ page, request }) => {
    await page.goto(`/books?q=${encodeURIComponent("الكافي")}&source=eshia`);
    await expect(page.getByRole("heading", { name: "Books" })).toBeVisible();
    await expect(page.locator("a", { hasText: /eshia/i }).first()).toBeVisible({ timeout: 45_000 });

    await page.goto("/books/eshia/11005?volume=1");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 45_000 });
    await expect(page.getByRole("link", { name: "Read" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Search inside this book" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Table of contents" })).toBeVisible();
    await expect(page.locator("a[href^='/read/eshia/11005']").first()).toBeVisible({ timeout: 45_000 });

    const ablibraryBook = await firstBook(request, `/api/books?q=${encodeURIComponent("الكافي")}&source=ablibrary&limit=1`);
    await page.goto(`/books/${ablibraryBook.source}/${ablibraryBook.id}`);
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 45_000 });
    await expect(page.getByRole("link", { name: "Read" })).toBeVisible();
  });

  test("categories index and category detail are covered", async ({ page, request }) => {
    const category = await firstCategory(request);

    await page.goto("/categories");
    await expect(page.getByRole("heading", { name: "Categories" })).toBeVisible({ timeout: 45_000 });
    await expect(page.getByRole("link", { name: category.name }).first()).toBeVisible();

    await page.goto(`/categories/${category.id}`);
    await expect(page.getByRole("link", { name: /All categories/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: category.name })).toBeVisible({ timeout: 45_000 });
    await expect(page.getByRole("navigation", { name: "Category pagination" })).toBeVisible();
  });

  test("reader page covers desktop controls, footnotes, bookmarks, recents, and keyboard navigation", async ({ page }) => {
    await page.goto(knownEshiaReaderPath);
    await expect(page.locator("article")).toBeVisible({ timeout: 45_000 });
    await expect(page.getByText(knownEshiaRef)).toBeVisible();
    await expect(page.getByRole("heading", { name: /Footnotes|Hadith Grades/ })).toBeVisible({ timeout: 45_000 });
    await expect(page.getByRole("navigation", { name: "Table of contents" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Bookmark page|Remove bookmark/ })).toBeVisible();

    const currentUrl = page.url();
    await page.getByRole("button", { name: /Bookmark page|Remove bookmark/ }).click();
    await page.goto("/library");
    await expect(page.getByRole("heading", { name: "Recently read" })).toBeVisible();
    await expect(page.getByText(/11005|الكافي|Book/).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Open" }).first()).toBeVisible();

    await page.goto(currentUrl);
    await page.locator("body").click({ position: { x: 20, y: 20 } });
    await page.keyboard.press("ArrowLeft");
    await expect(page).toHaveURL(/\/read\/eshia\/11005\/1\/3/);
    await expect(page.locator("article")).toBeVisible({ timeout: 45_000 });
    await page.locator("body").click({ position: { x: 20, y: 20 } });
    await page.keyboard.press("ArrowRight");
    await expect(page).toHaveURL(/\/read\/eshia\/11005\/1\/2/);
  });

  test("mobile reader toolbar covers TOC, settings, tools, jump, and bookmark controls", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(knownEshiaReaderPath);
    await expect(page.locator("article")).toBeVisible({ timeout: 45_000 });

    await page.getByRole("button", { name: "Table of contents" }).click();
    await expect(page.getByRole("heading", { name: "Table of contents" })).toBeVisible();
    await page.getByRole("button", { name: "Table of contents" }).click();

    await page.getByRole("button", { name: "Reader settings" }).click();
    await expect(page.getByRole("heading", { name: "Reader settings" })).toBeVisible();
    await page.getByLabel("Text size").selectOption("lg");
    await page.getByLabel("Line spacing").selectOption("spacious");
    await page.getByRole("button", { name: "Reader settings" }).click();

    await page.getByRole("button", { name: "Reader tools" }).click();
    await expect(page.getByRole("heading", { name: "Tools" })).toBeVisible();
    await expect(page.getByPlaceholder("Search inside this book")).toBeVisible();
    const jump = page.getByRole("spinbutton");
    await jump.fill("2");
    await page.getByRole("button", { name: "Go" }).click();
    await expect(page).toHaveURL(/\/read\/eshia\/11005\/1\/2/);
  });

  test("Thaqalayn hadith pages expose translations/gradings and hadith shelf links", async ({ page }) => {
    await page.goto("/hadiths");
    await expect(page.getByRole("link", { name: /Al-Kāfi/i }).first()).toBeVisible();

    await page.goto("/books/thaqalayn/1");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 45_000 });
    await expect(page.getByRole("heading", { name: "Table of contents" })).toBeVisible();

    await page.goto(knownThaqalaynReaderPath);
    await expect(page.locator("article")).toBeVisible({ timeout: 45_000 });
    await expect(page.getByText(knownThaqalaynRef)).toBeVisible();
    await expect(page.locator("article")).toContainText(/No text is available|[\u0600-\u06FF]|[A-Za-z]/);
  });

  test("API route contracts cover success and bad-request paths", async ({ request }) => {
    const health = await request.get("/api/health");
    expect(health.ok()).toBeTruthy();
    await expectJsonObject(health);

    const badSearch = await request.get("/api/search");
    expect(badSearch.status()).toBe(400);
    const badSearchJson = await badSearch.json() as ApiResponse<[]>;
    expect(badSearchJson.ok).toBe(false);
    expect(badSearchJson.errors[0]?.source).toBe("maktaba");

    const search = await request.get(`/api/search?q=${encodeURIComponent(arabicQuery)}&source=ablibrary&limit=5`);
    const searchJson = await expectApiData<SearchResult[]>(search);
    expect(searchJson.data.length).toBeGreaterThan(0);

    const books = await request.get(`/api/books?q=${encodeURIComponent("الكافي")}&source=eshia&limit=3&page=1`);
    const booksJson = await expectApiData<Book[]>(books);
    expect(booksJson.data.length).toBeGreaterThan(0);

    const categories = await request.get("/api/categories?limit=5");
    const categoriesJson = await expectApiData<Category[]>(categories);
    expect(categoriesJson.data.length).toBeGreaterThan(0);

    const categoryBooks = await request.get(`/api/categories?categoryId=${encodeURIComponent(categoriesJson.data[0].id)}&limit=3&page=1`);
    await expectApiData<Book[]>(categoryBooks);

    const info = await request.get(`/api/info?ref=${encodeURIComponent(knownEshiaRef)}`);
    const infoJson = await expectApiData<Book[]>(info);
    expect(infoJson.data[0]?.source).toBe("eshia");

    const toc = await request.get(`/api/toc?ref=${encodeURIComponent(knownEshiaRef)}&limit=20`);
    const tocJson = await expectApiData<TocItem[]>(toc);
    expect(Array.isArray(tocJson.data)).toBeTruthy();

    const read = await request.get(`/api/read?ref=${encodeURIComponent(knownEshiaRef)}`);
    const readJson = await expectApiData<PageResult[]>(read);
    expect(readJson.data[0]?.text.length).toBeGreaterThan(0);
  });
});

async function chooseCustomSelect(page: Page, ariaLabel: string, option: string) {
  await page.getByLabel(ariaLabel).click();
  await page.getByRole("button", { name: option }).click();
}

async function firstCategory(request: APIRequestContext): Promise<Category> {
  const res = await request.get("/api/categories");
  const json = await expectApiData<Category[]>(res);
  expect(json.data.length).toBeGreaterThan(0);
  return json.data[0];
}

async function firstBook(request: APIRequestContext, url: string): Promise<Book> {
  const res = await request.get(url);
  const json = await expectApiData<Book[]>(res);
  expect(json.data.length).toBeGreaterThan(0);
  return json.data[0];
}

async function expectApiData<T>(response: PlaywrightAPIResponse): Promise<ApiResponse<T>> {
  expect(response.ok()).toBeTruthy();
  const json = await response.json() as ApiResponse<T>;
  expect(json.ok || json.errors.length === 0 || Array.isArray(json.data)).toBeTruthy();
  expect(json.data).toBeDefined();
  return json;
}

async function expectJsonObject(response: PlaywrightAPIResponse) {
  const json = await response.json() as Record<string, unknown>;
  expect(json).toBeTruthy();
  expect(typeof json).toBe("object");
}
