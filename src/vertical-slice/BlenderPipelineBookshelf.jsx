import { Suspense } from 'react'
import { Clone, useGLTF } from '@react-three/drei'

const MODEL_URL = '/models/pipeline-bookshelf.glb'

function BookshelfModel(props) {
  const { scene } = useGLTF(MODEL_URL)

  return (
    <group name="blender-pipeline-bookshelf" {...props} dispose={null}>
      <Clone object={scene} castShadow receiveShadow />
    </group>
  )
}

export function BlenderPipelineBookshelf(props) {
  return (
    <Suspense fallback={null}>
      <BookshelfModel {...props} />
    </Suspense>
  )
}

useGLTF.preload(MODEL_URL)
