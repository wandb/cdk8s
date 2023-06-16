import { z } from 'zod'

export const minioConfig = z.object({
  image: z
    .object({
      repository: z.string().optional(),
      tag: z.string().optional(),
    })
    .optional(),

  client: z
    .object({
      image: z
        .object({
          repository: z.string().optional(),
          tag: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
})

export type MinioConfig = z.infer<typeof minioConfig>
