import { ContainerProps, ImagePullPolicy } from 'cdk8s-plus-26'
import { z } from 'zod'

export const image = z.object({
  repository: z.string(),
  tag: z.string(),
  pullPolicy: z.nativeEnum(ImagePullPolicy).optional(),
})

export type ImageConfig = z.infer<typeof image>

export const configToContainer = (config: ImageConfig): ContainerProps => {
  const { repository, tag, pullPolicy } = config
  return {
    image: `${repository}:${tag}`,
    imagePullPolicy: pullPolicy,
  }
}
