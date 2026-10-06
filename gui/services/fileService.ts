import { apiFetch } from "@/lib/api";

/** Uploads an image and resolves to its stored URL. Matches ImageInput's `onUpload` signature. */
export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiFetch("/files/upload", {
    method: "POST",
    body: formData,
  });
  return res.data;
}
