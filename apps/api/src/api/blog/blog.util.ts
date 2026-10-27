// utils/toc.util.ts
import { TocItem, TiptapContent, TiptapContentItem } from '@workspace/contracts';
import { PostMetaResult } from './blog.types.js';

export const generateSlug = (text: string): string => {
  return (
    text
      .trim()
      .toLowerCase()
      // \p{L}: 모든 언어의 문자 (한글, 영문, 한자, 일본어 등)
      // \p{N}: 모든 숫자
      // \s: 공백, -: 하이픈
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '') || 'section'
  );
};

export const getHeadingText = (node?: TiptapContentItem | null): string => {
  if (!node || typeof node !== "object") return "";
  if (typeof node.text === "string") {
    return node.text;
  }
  if (node.type === "hardBreak") {
    return " ";
  }
  if (Array.isArray(node.content)) {
    return node.content
      .map((child) => getHeadingText(child))
      .join("")
      .replace(/\s+/g, " ");
  }
  return "";
};

export const extractPostMeta = (doc: TiptapContent): PostMetaResult => {
  // content 배열이 없는 빈 문서 예외 처리
  if (!doc.content || !Array.isArray(doc.content)) {
    return {
      content: doc,
      toc: [],
      summary: "",
    };
  }

  const toc: TocItem[] = [];
  const idCounts = new Map<string, number>();
  const summaryChunks: string[] = [];

  // 자식 노드 순회 및 attrs.id 주입 (불변성 유지)
  const processNode = (node: TiptapContentItem): TiptapContentItem => {
    if (!node || typeof node !== "object") return node;

    const clonedNode: TiptapContentItem = { ...node };
    const type = clonedNode.type?.toLowerCase() ?? "";

    // 1. Heading 처리: TOC 수집 & ID 생성 및 attrs에 주입
    if (type === "heading") {
      const level =
        typeof clonedNode.attrs?.level === "number"
          ? clonedNode.attrs.level
          : 1;
      const text = getHeadingText(clonedNode).trim();

      const baseSlug = generateSlug(text) || "heading";
      const count = idCounts.get(baseSlug) ?? 0;
      // 템플릿 리터럴 논리 오류 수정: count가 0일 때 "false" 문자열이 붙는 문제 방지
      const uniqueId = count > 0 ? `${baseSlug}-${count}` : baseSlug;
      idCounts.set(baseSlug, count + 1);

      // TOC 배열에 수집
      toc.push({
        id: uniqueId,
        text,
        level,
      });

      // 렌더링 시 앵커 연결을 위해 노드 attrs에 id 주입
      clonedNode.attrs = {
        ...clonedNode.attrs,
        id: uniqueId,
      };
    }

    // 2. Text 노드 처리: Summary 수집 (코드 블록 텍스트 등 제외 필터링 가능)
    if (type === "text" && typeof clonedNode.text === "string") {
      const trimmed = clonedNode.text.trim();
      if (trimmed) {
        summaryChunks.push(trimmed);
      }
    }

    // 3. 자식 노드 재귀 순회 (paragraph, list_item, blockquote 등의 하위 text 탐색)
    if (Array.isArray(clonedNode.content)) {
      clonedNode.content = clonedNode.content.map(processNode);
    }

    return clonedNode;
  };

  const processedContent: TiptapContent = {
    ...doc,
    content: doc.content.map(processNode),
  };

  return {
    content: processedContent,
    toc,
    summary: summaryChunks.join(" "),
  };
};
