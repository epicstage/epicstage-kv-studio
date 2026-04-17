import { describe, expect, it } from "vitest";
import {
  base64ToBytes,
  dataUrlToBlob,
  resolveMime,
  stripDataUrlPrefix,
} from "./image-utils";

function fakeFile(name: string, type: string, content = "hi"): File {
  return new File([content], name, { type });
}

describe("resolveMime", () => {
  it("uses the File.type when present", () => {
    expect(resolveMime(fakeFile("a.png", "image/png"))).toBe("image/png");
  });

  it("falls back to extension when type is empty", () => {
    expect(resolveMime(fakeFile("logo.svg", ""))).toBe("image/svg+xml");
    expect(resolveMime(fakeFile("logo.PNG", ""))).toBe("image/png");
    expect(resolveMime(fakeFile("slides.pptx", ""))).toBe(
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    );
  });

  it("falls back to extension when type is application/octet-stream", () => {
    expect(resolveMime(fakeFile("ref.jpeg", "application/octet-stream"))).toBe("image/jpeg");
  });

  it("returns octet-stream for unknown extensions", () => {
    expect(resolveMime(fakeFile("weird.xyz", ""))).toBe("application/octet-stream");
  });
});

describe("stripDataUrlPrefix", () => {
  it("removes the data URL prefix", () => {
    expect(stripDataUrlPrefix("data:image/png;base64,AAAA")).toBe("AAAA");
  });

  it("returns the input unchanged when no comma is present", () => {
    expect(stripDataUrlPrefix("AAAA")).toBe("AAAA");
  });
});

describe("base64ToBytes", () => {
  it("decodes base64 to bytes", () => {
    const bytes = base64ToBytes("aGk="); // "hi"
    expect(Array.from(bytes)).toEqual([0x68, 0x69]);
  });
});

describe("dataUrlToBlob", () => {
  it("produces a blob with the correct MIME", () => {
    const blob = dataUrlToBlob("data:image/png;base64,aGk=");
    expect(blob.type).toBe("image/png");
    expect(blob.size).toBe(2);
  });
});
