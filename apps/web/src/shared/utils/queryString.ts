export type QueryValue = string | number | boolean | null | undefined | QueryValue[] | QueryObject;
export type QueryObject = { [key: string]: QueryValue };

function append(params: URLSearchParams, key: string, value: QueryValue) {
  if (value === undefined || value === null) return;
  if (Array.isArray(value)) {
    for (const item of value) append(params, key, item);
    return;
  }
  if (typeof value === "object") {
    for (const [sub, item] of Object.entries(value)) append(params, `${key}[${sub}]`, item);
    return;
  }
  params.append(key, String(value));
}

export function toQueryString(query: QueryObject | undefined): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) append(params, key, value);
  const text = params.toString();
  return text ? `?${text}` : "";
}
