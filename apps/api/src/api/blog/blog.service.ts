import prisma, {
  ExtendedTransactionClient,
} from "../../shared/config/psql.config.js";
import { CreatePostInput, CreateCommentInput } from "./blog.types.js";
import { Prisma } from "../../generated/prisma/client.js";
import { extractPostMeta, generateSlug } from "./blog.util.js";
import { ApiError } from "../../shared/middlewares/error.middleware.js";
import {
  Category,
  PostListItem,
  BLOG_CONSTANTS,
  PostDetail,
  CreatePostPayload,
  CreatePostResponse,
  CommentItemResponse,
} from "@workspace/contracts";

export async function getCategories() {
  return (await prisma.category.findMany({
    orderBy: {
      name: "asc",
    },
  })) satisfies Category[];
}

export async function getCategoryBySlug(slug: string) {
  const category = await prisma.category.findUnique({
    where: {
      slug,
    },
  });
  if (!category) throw ApiError.notFound("카테고리를 찾을 수 없습니다.");
  return category satisfies Category;
}

export async function getPosts(categorySlug: string) {
  const posts = await prisma.post.findMany({
    where:
      categorySlug === BLOG_CONSTANTS.CATEGORY_ALL
        ? undefined
        : { category: { slug: categorySlug } },
    select: {
      id: true,
      slug: true,
      category: true,
      title: true,
      summary: true,
      createdAt: true,
      updatedAt: true,
      images: {
        where: {
          displayOrder: 0,
        },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return posts satisfies PostListItem[];
}

export async function getPostBySlug(slug: string) {
  const post = await prisma.post.findUnique({
    where: {
      slug,
    },
    select: {
      id: true,
      author: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      category: {
        select: {
          name: true,
        },
      },
      title: true,
      toc: true,
      content: true,
      images: {
        select: {
          url: true,
          width: true,
          height: true,
        },
      },
      likes: {
        select: {
          userId: true,
        },
      },
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!post) throw ApiError.notFound("포스트를 찾을 수 없습니다.");

  return post satisfies PostDetail;
}

export async function createPost(post: CreatePostPayload, authorId: string) {
  const { categoryName, content, images, ...input } = post;
  const { content: processedContent, summary, toc } = extractPostMeta(content);

  const result = await prisma.$transaction(
    async (tx: ExtendedTransactionClient) => {
      const baseSlug = generateSlug(input.title);
      const getUniqueSlug = async (slug: string, step = 0): Promise<string> => {
        const uniqueSlug = step > 0 ? `${slug}-${step}` : slug;
        const isExistSlug = await tx.post.findUnique({
          where: { slug: uniqueSlug },
          select: { id: true },
        });
        if (isExistSlug) return await getUniqueSlug(slug, step + 1);
        return uniqueSlug;
      };

      const uniqueSlug = await getUniqueSlug(baseSlug);
      const createdPost = await tx.post.create({
        data: {
          ...input,
          slug: uniqueSlug,
          summary,
          toc,
          content: processedContent,
          author: { connect: { id: authorId } },
          category: {
            connectOrCreate: {
              where: { name: categoryName },
              create: {
                slug: generateSlug(categoryName),
                name: categoryName,
              },
            },
          },
          ...(images.length > 0 && {
            images: {
              createMany: {
                data: images.map((image, index) => ({
                  url: image.url,
                  width: image.width,
                  height: image.height,
                  displayOrder: image.displayOrder ?? index, // 방어 처리
                })),
              },
            },
          }),
        },
        select: {
          slug: true,
          category: {
            select: {
              slug: true,
            },
          },
        },
      });

      return createdPost;
    },
  );

  return result satisfies CreatePostResponse;
}

export async function editPost(
  post: CreatePostInput,
  authorId: string,
  postId: number,
) {
  // 1. 기존 게시글 조회 (소유권 체크 및 기존 슬러그/제목 확인)
  const postToUpdate = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      title: true,
      slug: true,
      author: { select: { id: true } },
      images: { select: { url: true } },
      category: { select: { id: true, name: true } },
    },
  });

  if (!postToUpdate) throw ApiError.notFound("Post not found");

  // ⭐️ [소유권 인가 검증]: 서비스단에서 처리하는 것이 정확함
  if (postToUpdate.author.id !== authorId) {
    throw ApiError.forbidden("You are not authorized to edit this post");
  }

  const { categoryName, content, images, ...input } = post;
  const { content: processedContent, toc, summary } = extractPostMeta(content);

  const existingImageUrls = new Set(postToUpdate.images.map((img) => img.url));
  const newImageUrls = new Set(images.map((img) => img.url));

  const imagesToDelete = postToUpdate.images.filter(
    (img) => !newImageUrls.has(img.url),
  );
  const imagesToCreate = images.filter(
    (img) => !existingImageUrls.has(img.url),
  );
  const imagesToUpdate = images.filter((img) => existingImageUrls.has(img.url));

  const oldCategoryId = postToUpdate.category.id;

  return await prisma.$transaction(async (tx: ExtendedTransactionClient) => {
    // ⭐️ 제목이 변경되었을 때만 새 슬러그 채번 (기존 URL 보존)
    let finalSlug = postToUpdate.slug;
    if (postToUpdate.title !== input.title) {
      const baseSlug = generateSlug(input.title);
      const getUniqueSlug = async (slug: string, step = 0): Promise<string> => {
        const uniqueSlug = step > 0 ? `${slug}-${step}` : slug;
        const isExistSlug = await tx.post.findUnique({
          where: { slug: uniqueSlug },
          select: { id: true },
        });
        if (isExistSlug) return await getUniqueSlug(slug, step + 1);
        return uniqueSlug;
      };
      finalSlug = await getUniqueSlug(baseSlug);
    }

    // 1. Post 수정
    const updatedPost = await tx.post.update({
      where: { id: postId },
      data: {
        ...input,
        slug: finalSlug,
        summary, // 누락되었던 요약문 반영
        toc,
        content: processedContent,
        category: {
          connectOrCreate: {
            where: { name: categoryName },
            create: {
              slug: generateSlug(categoryName),
              name: categoryName,
            },
          },
        },
      },
      select: {
        slug: true,
        category: { select: { slug: true } },
      },
    });

    // 2. 삭제 대상 이미지 제거
    if (imagesToDelete.length > 0) {
      await tx.postImage.deleteMany({
        where: {
          postId,
          url: { in: imagesToDelete.map((img) => img.url) },
        },
      });
    }

    // 3. 추가된 이미지 생성
    if (imagesToCreate.length > 0) {
      await tx.postImage.createMany({
        data: imagesToCreate.map((image) => ({
          postId,
          url: image.url,
          width: image.width,
          height: image.height,
          displayOrder: images.findIndex((item) => item.url === image.url),
        })),
      });
    }

    // 4. 유지된 이미지 메타데이터(순서/크기) 갱신
    if (imagesToUpdate.length > 0) {
      await Promise.all(
        imagesToUpdate.map((image) =>
          tx.postImage.updateMany({
            where: { postId, url: image.url },
            data: {
              displayOrder: images.findIndex((item) => item.url === image.url),
              width: image.width,
              height: image.height,
            },
          }),
        ),
      );
    }

    // 5. 빈 카테고리 정리
    const oldCategoryCount = await tx.category.findUnique({
      where: { id: oldCategoryId },
      include: { _count: { select: { posts: true } } },
    });

    if (oldCategoryCount && oldCategoryCount._count.posts === 0) {
      await tx.category.delete({ where: { id: oldCategoryId } });
    }

    return updatedPost satisfies CreatePostResponse;
  });
}

export async function deletePost(authorId: string, postId: number) {
  const post = await prisma.post.findUnique({
    where: {
      id: postId,
    },
    select: {
      id: true,
      authorId: true,
      categoryId: true,
    },
  });

  if (!post) throw ApiError.notFound("Post not found");
  if (post.authorId !== authorId)
    throw ApiError.forbidden("You are not the author of this post");

  const categoryId = post.categoryId;

  await prisma.post.delete({
    where: {
      id: postId,
    },
  });
  if (!categoryId) return "/blog";
  const category = await prisma.category.findUnique({
    where: {
      id: categoryId,
    },
    select: {
      slug: true,
      _count: {
        select: {
          posts: true,
        },
      },
    },
  });
  if (category && category._count.posts > 0) {
    return `/blog/${category.slug}`;
  } else {
    await prisma.category.delete({
      where: {
        id: categoryId,
      },
    });
    return "/blog";
  }
}

export async function getComments(postId: number) {
  const comments = await prisma.comment.findMany({
    where: {
      postId,
    },
    select: {
      id: true,
      content: true,
      parentId: true,
      deletedAt: true,
      createdAt: true,
      updatedAt: true,
      author: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
  return comments satisfies CommentItemResponse[];
}

export async function createComment(
  comment: CreateCommentInput,
  authorId: string,
) {
  const user = await prisma.user.findUnique({ where: { id: authorId } });
  if (!user) throw new ApiError(404, "NOT_FOUND", "User not found");

  const { postId, content, parentId } = comment;
  return await prisma.comment.create({
    data: {
      postId,
      authorId,
      content,
      parentId,
    },
    select: {
      id: true,
    },
  });
}

export async function editComment(
  id: number,
  content: string,
  authorId: string,
) {
  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) throw new ApiError(404, "NOT_FOUND", "Comment not found");
  if (comment.authorId !== authorId)
    throw new ApiError(
      403,
      "FORBIDDEN",
      "You are not the author of this comment",
    );

  await prisma.comment.update({
    where: { id },
    data: {
      content,
    },
  });
}

export async function deleteComment(id: number, authorId: string) {
  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) throw new ApiError(404, "NOT_FOUND", "Comment not found");
  if (comment.authorId !== authorId)
    throw new ApiError(
      403,
      "FORBIDDEN",
      "You are not the author of this comment",
    );

  const deletedIds: number[] = [];

  const deleteDeletedParents = async (
    tx: ExtendedTransactionClient,
    id: number,
  ): Promise<void> => {
    const comment = await tx.comment.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        parentId: true,
        deletedAt: true,
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });

    if (!comment || !comment.deletedAt || comment._count.replies > 0) {
      return;
    }

    await tx.comment.delete({
      where: {
        id,
      },
    });

    deletedIds.push(id);

    if (comment.parentId) {
      await deleteDeletedParents(tx, comment.parentId);
    }
  };

  await prisma.$transaction(async (tx: ExtendedTransactionClient) => {
    const comment = await tx.comment.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        parentId: true,
        deletedAt: true,
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });

    if (!comment) {
      throw new Error("댓글을 찾을 수 없습니다.");
    }

    if (comment._count.replies > 0) {
      await tx.comment.update({
        where: {
          id,
        },
        data: {
          deletedAt: new Date(),
        },
      });

      return;
    }

    await tx.comment.delete({
      where: {
        id,
      },
    });

    deletedIds.push(id);

    if (comment.parentId) {
      await deleteDeletedParents(tx, comment.parentId);
    }
  });

  return deletedIds;
}

export async function likePost(postId: number, userId: string) {
  const post = await prisma.post.findUnique({
    where: {
      id: postId,
    },
  });

  if (!post) {
    throw new ApiError(404, "NOT_FOUND", "포스트를 찾을 수 없습니다.");
  }

  const existingLike = await prisma.like.findUnique({
    where: {
      postId_userId: {
        postId,
        userId,
      },
    },
  });

  if (existingLike) {
    await prisma.like.delete({
      where: {
        id: existingLike.id,
      },
    });
    return;
  }

  await prisma.like.create({
    data: {
      postId,
      userId,
    },
  });
}
