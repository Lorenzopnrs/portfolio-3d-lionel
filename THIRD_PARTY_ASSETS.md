# Third-Party Assets

Only material textures are sourced externally. All visible architecture,
furniture, books, paper, lighting props, textile geometry and vegetation are
modeled specifically for this project in Blender.

All downloaded source files are web-sized JPEG maps stored under
`assets/textures/entrance/`. Only maps used by the final GLB are kept:
diffuse, OpenGL normal and roughness maps for stone, floor, wood and leather,
plus one OpenGL normal map for the runner. The download script reduces
roughness maps to 512x512 before Blender repacks them into glTF
metallic-roughness textures. Diffuse and normal maps remain at 1K for
near-camera surfaces.

The restored runner albedo at
`public/textures/vertical-slice/worn-runner-albedo.jpg` is an existing,
project-authored and Git-tracked asset. It is not a third-party download and
is intentionally not managed by the external texture download script.

## Poly Haven Textures

Poly Haven publishes these assets under the
[CC0 license](https://polyhaven.com/license).

| Asset | Author | Source | License | Local files and use |
| --- | --- | --- | --- | --- |
| Medieval Blocks 03 | Rob Tuytel | [Poly Haven](https://polyhaven.com/a/medieval_blocks_03) | [CC0](https://polyhaven.com/license) | `medieval_blocks_03_diff_1k.jpg`, `medieval_blocks_03_nor_gl_1k.jpg`, `medieval_blocks_03_rough_512.jpg`; aged stone walls, vaults, arches, pillars and moldings |
| Stone Tiles 02 | Charlotte Baglioni | [Poly Haven](https://polyhaven.com/a/stone_tiles_02) | [CC0](https://polyhaven.com/license) | `stone_tiles_02_diff_1k.jpg`, `stone_tiles_02_nor_gl_1k.jpg`, `stone_tiles_02_rough_512.jpg`; worn floor slabs |
| Dark Wood | Dario Barresi, Dimitrios Savva and Rico Cilliers | [Poly Haven](https://polyhaven.com/a/dark_wood) | [CC0](https://polyhaven.com/license) | `dark_wood_diff_1k.jpg`, `dark_wood_nor_gl_1k.jpg`, `dark_wood_rough_512.jpg`; shelves, desk, lectern and small archive props |
| Leather Red 02 | Rob Tuytel | [Poly Haven](https://polyhaven.com/a/leather_red_02) | [CC0](https://polyhaven.com/license) | `leather_red_02_coll1_1k.jpg`, `leather_red_02_nor_gl_1k.jpg`, `leather_red_02_rough_512.jpg`; worn book covers and notebooks |
| Quatrefoil Jacquard Fabric | colormass and Rico Cilliers | [Poly Haven](https://polyhaven.com/a/quatrefoil_jacquard_fabric) | [CC0](https://polyhaven.com/license) | `quatrefoil_jacquard_fabric_nor_gl_1k.jpg`; worn burgundy runners |

No HDRI, complete environment kit or finished prop model is included.

## Draco Decoder

The local Draco decoder files under `public/draco/` are copied from the
installed `three` package so compressed GLB files can be decoded without a
runtime CDN request. Three.js is maintained by mrdoob and contributors and is
distributed under the [MIT license](https://github.com/mrdoob/three.js/blob/dev/LICENSE).
The local files are `draco_decoder.js`, `draco_decoder.wasm` and
`draco_wasm_wrapper.js`.
