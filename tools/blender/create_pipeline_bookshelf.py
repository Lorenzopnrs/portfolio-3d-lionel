from pathlib import Path

import bpy


PROJECT_ROOT = Path(__file__).resolve().parents[2]
BLEND_PATH = PROJECT_ROOT / "assets" / "blender" / "pipeline_bookshelf.blend"
GLB_PATH = PROJECT_ROOT / "public" / "models" / "pipeline-bookshelf.glb"


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)

    for data_collection in (
        bpy.data.meshes,
        bpy.data.curves,
        bpy.data.materials,
        bpy.data.cameras,
        bpy.data.lights,
    ):
        for data_block in list(data_collection):
            if data_block.users == 0:
                data_collection.remove(data_block)


def create_material(name, color, roughness=0.8, metallic=0.0):
    material = bpy.data.materials.new(name=name)
    material.use_nodes = True
    material.diffuse_color = (*color, 1.0)

    shader = next(
        node
        for node in material.node_tree.nodes
        if node.type == "BSDF_PRINCIPLED"
    )
    shader.inputs["Base Color"].default_value = (*color, 1.0)
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Metallic"].default_value = metallic

    return material


def create_box(
    name,
    dimensions,
    location,
    material,
    parent,
    bevel_width=0.015,
    rotation=(0.0, 0.0, 0.0),
):
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=rotation)
    asset_part = bpy.context.object
    asset_part.name = name
    asset_part.data.name = f"{name}Mesh"
    asset_part.dimensions = dimensions

    bpy.context.view_layer.objects.active = asset_part
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)

    if bevel_width > 0:
        bevel = asset_part.modifiers.new(name="EdgeSoftening", type="BEVEL")
        bevel.width = min(bevel_width, min(dimensions) * 0.2)
        bevel.segments = 2
        bpy.ops.object.modifier_apply(modifier=bevel.name)

    asset_part.data.materials.append(material)
    asset_part.parent = parent

    return asset_part


def create_bookshelf():
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0
    scene["pipeline_asset"] = "compact_bookshelf"
    scene["pipeline_units"] = "meters"

    root = bpy.data.objects.new("PipelineBookshelf", None)
    root.empty_display_type = "CUBE"
    root.empty_display_size = 0.25
    root.location = (0.0, 0.0, 0.0)
    root["origin"] = "bottom_center"
    scene.collection.objects.link(root)

    oak = create_material("DarkOak", (0.12, 0.075, 0.045), roughness=0.82)
    worn_oak = create_material(
        "WornOak",
        (0.19, 0.12, 0.07),
        roughness=0.9,
    )
    book_red = create_material(
        "BookBurgundy",
        (0.23, 0.045, 0.035),
        roughness=0.88,
    )
    book_green = create_material(
        "BookForest",
        (0.045, 0.12, 0.07),
        roughness=0.9,
    )
    book_blue = create_material(
        "BookCharcoalBlue",
        (0.035, 0.065, 0.09),
        roughness=0.9,
    )
    book_umber = create_material(
        "BookUmber",
        (0.18, 0.09, 0.035),
        roughness=0.92,
    )

    width = 1.5
    depth = 0.38
    height = 2.15
    side_width = 0.13
    shelf_width = width - side_width * 2

    create_box(
        "Plinth",
        (1.58, 0.44, 0.16),
        (0.0, 0.0, 0.08),
        worn_oak,
        root,
        bevel_width=0.025,
    )
    create_box(
        "BackPanel",
        (shelf_width, 0.055, 1.84),
        (0.0, depth / 2 - 0.028, 1.08),
        worn_oak,
        root,
        bevel_width=0.008,
    )
    create_box(
        "LeftSide",
        (side_width, depth, 1.91),
        (-width / 2 + side_width / 2, 0.0, 1.115),
        oak,
        root,
        bevel_width=0.018,
    )
    create_box(
        "RightSide",
        (side_width, depth, 1.91),
        (width / 2 - side_width / 2, 0.0, 1.115),
        oak,
        root,
        bevel_width=0.018,
    )

    shelf_heights = (0.22, 0.69, 1.16, 1.63)
    for shelf_index, shelf_height in enumerate(shelf_heights, start=1):
        create_box(
            f"Shelf_{shelf_index:02d}",
            (shelf_width, depth, 0.075),
            (0.0, 0.0, shelf_height),
            oak,
            root,
            bevel_width=0.012,
        )

    create_box(
        "TopBeam",
        (1.58, 0.42, 0.16),
        (0.0, 0.0, height - 0.12),
        oak,
        root,
        bevel_width=0.025,
    )
    create_box(
        "TopCornice",
        (1.68, 0.47, 0.09),
        (0.0, -0.005, height - 0.015),
        worn_oak,
        root,
        bevel_width=0.022,
    )

    book_materials = (book_red, book_green, book_blue, book_umber)
    book_layouts = (
        (
            (-0.49, 0.32, 0.105, -0.035),
            (-0.36, 0.37, 0.115, 0.02),
            (-0.22, 0.34, 0.13, 0.0),
            (-0.07, 0.39, 0.105, -0.015),
            (0.09, 0.31, 0.14, 0.04),
            (0.25, 0.36, 0.12, 0.0),
        ),
        (
            (-0.48, 0.38, 0.12, 0.0),
            (-0.33, 0.33, 0.11, -0.045),
            (-0.19, 0.4, 0.13, 0.025),
            (0.16, 0.35, 0.145, -0.02),
            (0.33, 0.3, 0.105, 0.035),
            (0.46, 0.37, 0.11, 0.0),
        ),
        (
            (-0.47, 0.34, 0.13, 0.025),
            (-0.3, 0.39, 0.11, -0.02),
            (-0.16, 0.36, 0.12, 0.0),
            (-0.01, 0.31, 0.115, 0.04),
            (0.31, 0.4, 0.13, -0.025),
            (0.47, 0.35, 0.105, 0.0),
        ),
    )

    for row_index, row_layout in enumerate(book_layouts):
        shelf_height = shelf_heights[row_index]
        for book_index, (x, book_height, book_width, lean) in enumerate(
            row_layout
        ):
            create_box(
                f"Book_{row_index + 1:02d}_{book_index + 1:02d}",
                (book_width, 0.25, book_height),
                (
                    x,
                    -depth / 2 + 0.145,
                    shelf_height + 0.045 + book_height / 2,
                ),
                book_materials[(book_index + row_index) % len(book_materials)],
                root,
                bevel_width=0.009,
                rotation=(0.0, lean, 0.0),
            )

    return root


def main():
    BLEND_PATH.parent.mkdir(parents=True, exist_ok=True)
    GLB_PATH.parent.mkdir(parents=True, exist_ok=True)

    clear_scene()
    root = create_bookshelf()

    bpy.context.view_layer.objects.active = root
    root.select_set(True)

    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))
    bpy.ops.export_scene.gltf(
        filepath=str(GLB_PATH),
        export_format="GLB",
        export_yup=True,
    )

    mesh_count = sum(1 for object_ in bpy.context.scene.objects if object_.type == "MESH")
    print(f"PIPELINE_BLEND={BLEND_PATH}")
    print(f"PIPELINE_GLB={GLB_PATH}")
    print(f"PIPELINE_MESH_COUNT={mesh_count}")


if __name__ == "__main__":
    main()
