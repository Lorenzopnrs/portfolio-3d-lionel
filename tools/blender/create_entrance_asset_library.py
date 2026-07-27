from math import cos, pi, radians, sin
from pathlib import Path
from random import Random

import bpy
from mathutils import Matrix, Vector


PROJECT_ROOT = Path(__file__).resolve().parents[2]
TEXTURE_DIRECTORY = PROJECT_ROOT / "assets" / "textures" / "entrance"
BLEND_PATH = (
    PROJECT_ROOT / "assets" / "blender" / "entrance_asset_library.blend"
)
GLB_PATH = (
    PROJECT_ROOT / "public" / "models" / "entrance-asset-library.glb"
)
PREVIEW_PATH = Path("/tmp/entrance-asset-library-preview.png")

RANDOM = Random(20260727)
ASSET_MESHES = {}
MATERIALS = {}
UV_VARIATION_MATERIALS = {
    "AgedPaper",
    "AgedStone",
    "AgedWax",
    "BlackenedIron",
    "BlackenedOak",
    "ControlledIvy",
    "DarkOak",
    "DryIvy",
    "LightAgedPaper",
    "TarnishedBrass",
    "WornBurgundyLeather",
    "WornFloorSlabs",
    "WornForestLeather",
    "WornStoneEdge",
    "WornUmberLeather",
}


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)

    for data_collection in (
        bpy.data.meshes,
        bpy.data.curves,
        bpy.data.materials,
        bpy.data.cameras,
        bpy.data.lights,
        bpy.data.images,
    ):
        for data_block in list(data_collection):
            if data_block.users == 0:
                data_collection.remove(data_block)


def shader_input(shader, name):
    input_socket = shader.inputs.get(name)

    if input_socket is None:
        raise RuntimeError(f"Missing Principled BSDF input: {name}")

    return input_socket


def load_texture(file_name, non_color=False):
    image_path = TEXTURE_DIRECTORY / file_name

    if not image_path.exists():
        raise FileNotFoundError(
            f"Required entrance texture is missing: {image_path}"
        )

    image = bpy.data.images.load(str(image_path), check_existing=True)
    image.name = file_name

    if non_color:
        image.colorspace_settings.name = "Non-Color"

    return image


def create_material(
    name,
    base_color,
    roughness,
    metallic=0.0,
    color_texture=None,
    normal_texture=None,
    roughness_texture=None,
    normal_strength=0.45,
    alpha=1.0,
    emission_color=None,
    emission_strength=0.0,
):
    material = bpy.data.materials.new(name=name)
    material.use_nodes = True
    material.diffuse_color = (*base_color, alpha)
    material.metallic = metallic
    material.roughness = roughness

    nodes = material.node_tree.nodes
    links = material.node_tree.links
    nodes.clear()

    output = nodes.new("ShaderNodeOutputMaterial")
    output.location = (620, 0)
    shader = nodes.new("ShaderNodeBsdfPrincipled")
    shader.location = (320, 0)
    shader_input(shader, "Base Color").default_value = (*base_color, 1.0)
    shader_input(shader, "Roughness").default_value = roughness
    shader_input(shader, "Metallic").default_value = metallic
    shader_input(shader, "Alpha").default_value = alpha
    links.new(shader.outputs["BSDF"], output.inputs["Surface"])

    if color_texture:
        color_node = nodes.new("ShaderNodeTexImage")
        color_node.name = f"{name}Color"
        color_node.image = load_texture(color_texture)
        color_node.location = (-520, 180)
        links.new(color_node.outputs["Color"], shader_input(shader, "Base Color"))

    if roughness_texture:
        roughness_node = nodes.new("ShaderNodeTexImage")
        roughness_node.name = f"{name}Roughness"
        roughness_node.image = load_texture(
            roughness_texture,
            non_color=True,
        )
        roughness_node.location = (-520, -40)
        links.new(
            roughness_node.outputs["Color"],
            shader_input(shader, "Roughness"),
        )

    if normal_texture:
        normal_node = nodes.new("ShaderNodeTexImage")
        normal_node.name = f"{name}Normal"
        normal_node.image = load_texture(normal_texture, non_color=True)
        normal_node.location = (-520, -260)
        normal_map = nodes.new("ShaderNodeNormalMap")
        normal_map.location = (-80, -220)
        normal_map.inputs["Strength"].default_value = normal_strength
        links.new(normal_node.outputs["Color"], normal_map.inputs["Color"])
        links.new(normal_map.outputs["Normal"], shader_input(shader, "Normal"))

    if emission_color is not None:
        shader_input(shader, "Emission Color").default_value = (
            *emission_color,
            1.0,
        )
        shader_input(shader, "Emission Strength").default_value = (
            emission_strength
        )

    return material


def create_material_library():
    MATERIALS.update(
        {
            "stone": create_material(
                "AgedStone",
                (0.34, 0.31, 0.27),
                0.94,
                color_texture="medieval_blocks_03_diff_1k.jpg",
                normal_texture="medieval_blocks_03_nor_gl_1k.jpg",
                roughness_texture="medieval_blocks_03_rough_512.jpg",
                normal_strength=0.5,
            ),
            "stone_dark": create_material(
                "DarkMortar",
                (0.105, 0.095, 0.082),
                0.98,
            ),
            "stone_worn": create_material(
                "WornStoneEdge",
                (0.255, 0.235, 0.205),
                0.9,
            ),
            "floor": create_material(
                "WornFloorSlabs",
                (0.27, 0.255, 0.24),
                0.91,
                color_texture="stone_tiles_02_diff_1k.jpg",
                normal_texture="stone_tiles_02_nor_gl_1k.jpg",
                roughness_texture="stone_tiles_02_rough_512.jpg",
                normal_strength=0.42,
            ),
            "wood": create_material(
                "DarkOak",
                (0.12, 0.065, 0.045),
                0.83,
                color_texture="dark_wood_diff_1k.jpg",
                normal_texture="dark_wood_nor_gl_1k.jpg",
                roughness_texture="dark_wood_rough_512.jpg",
                normal_strength=0.34,
            ),
            "wood_dark": create_material(
                "BlackenedOak",
                (0.055, 0.028, 0.018),
                0.84,
            ),
            "iron": create_material(
                "BlackenedIron",
                (0.035, 0.038, 0.036),
                0.68,
                metallic=0.78,
            ),
            "brass": create_material(
                "TarnishedBrass",
                (0.24, 0.14, 0.045),
                0.57,
                metallic=0.72,
            ),
            "leather": create_material(
                "WornBurgundyLeather",
                (0.22, 0.035, 0.025),
                0.64,
                color_texture="leather_red_02_coll1_1k.jpg",
                normal_texture="leather_red_02_nor_gl_1k.jpg",
                roughness_texture="leather_red_02_rough_512.jpg",
                normal_strength=0.3,
            ),
            "leather_green": create_material(
                "WornForestLeather",
                (0.035, 0.105, 0.055),
                0.74,
            ),
            "leather_umber": create_material(
                "WornUmberLeather",
                (0.16, 0.065, 0.025),
                0.76,
            ),
            "paper": create_material(
                "AgedPaper",
                (0.62, 0.53, 0.4),
                0.94,
            ),
            "paper_light": create_material(
                "LightAgedPaper",
                (0.76, 0.68, 0.53),
                0.92,
            ),
            "textile": create_material(
                "WornBurgundyTextile",
                (0.22, 0.03, 0.025),
                0.9,
                normal_texture=(
                    "quatrefoil_jacquard_fabric_nor_gl_1k.jpg"
                ),
                normal_strength=0.15,
            ),
            "wax": create_material(
                "AgedWax",
                (0.68, 0.58, 0.43),
                0.86,
            ),
            "wick": create_material(
                "CharredWick",
                (0.025, 0.018, 0.012),
                0.96,
            ),
            "glass": create_material(
                "DustyLanternGlass",
                (0.24, 0.2, 0.15),
                0.46,
                alpha=0.32,
            ),
            "flame": create_material(
                "CandleFlame",
                (1.0, 0.32, 0.045),
                0.3,
                emission_color=(1.0, 0.18, 0.025),
                emission_strength=5.0,
            ),
            "foliage": create_material(
                "ControlledIvy",
                (0.055, 0.125, 0.05),
                0.94,
            ),
            "foliage_dry": create_material(
                "DryIvy",
                (0.15, 0.09, 0.035),
                0.95,
            ),
        }
    )


def stable_seed(value):
    seed = 2166136261

    for character in value:
        seed ^= ord(character)
        seed = (seed * 16777619) & 0xFFFFFFFF

    return seed


def vary_uvs(object_, material):
    if (
        material.name not in UV_VARIATION_MATERIALS
        or not object_.data.uv_layers
    ):
        return

    randomizer = Random(stable_seed(f"{object_.name}:{material.name}"))
    scale = randomizer.uniform(0.88, 1.18)
    offset_u = randomizer.uniform(0.0, 1.0)
    offset_v = randomizer.uniform(0.0, 1.0)
    uv_layer = object_.data.uv_layers.active

    for loop in uv_layer.data:
        loop.uv.x = loop.uv.x * scale + offset_u
        loop.uv.y = loop.uv.y * scale + offset_v


def create_root(name, category):
    root = bpy.data.objects.new(name, None)
    root.empty_display_type = "PLAIN_AXES"
    root.empty_display_size = 0.35
    root["asset_category"] = category
    root["units"] = "meters"
    bpy.context.scene.collection.objects.link(root)
    return root


def apply_transform(object_):
    bpy.context.view_layer.objects.active = object_
    object_.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    object_.select_set(False)


def apply_bevel(object_, width, segments=1):
    if width <= 0:
        return

    bevel = object_.modifiers.new(name="EdgeTreatment", type="BEVEL")
    bevel.width = width
    bevel.segments = segments
    bevel.limit_method = "ANGLE"
    bpy.context.view_layer.objects.active = object_
    object_.select_set(True)
    bpy.ops.object.modifier_apply(modifier=bevel.name)
    object_.select_set(False)


def attach_material(object_, material):
    object_.data.materials.append(material)


def create_box(
    name,
    dimensions,
    location,
    material,
    parent,
    bevel=0.015,
    rotation=(0.0, 0.0, 0.0),
):
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=rotation)
    object_ = bpy.context.object
    object_.name = name
    object_.data.name = f"{name}Mesh"
    object_.dimensions = dimensions
    apply_transform(object_)
    apply_bevel(object_, min(bevel, min(dimensions) * 0.18))
    attach_material(object_, material)
    vary_uvs(object_, material)
    object_.parent = parent
    return object_


def create_cylinder(
    name,
    radius,
    depth,
    location,
    material,
    parent,
    vertices=16,
    bevel=0.008,
    rotation=(0.0, 0.0, 0.0),
):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices,
        radius=radius,
        depth=depth,
        location=location,
        rotation=rotation,
    )
    object_ = bpy.context.object
    object_.name = name
    object_.data.name = f"{name}Mesh"
    apply_transform(object_)
    apply_bevel(object_, bevel)
    attach_material(object_, material)
    vary_uvs(object_, material)
    object_.parent = parent
    return object_


def create_cone(
    name,
    radius_bottom,
    radius_top,
    depth,
    location,
    material,
    parent,
    vertices=16,
    bevel=0.006,
    rotation=(0.0, 0.0, 0.0),
):
    bpy.ops.mesh.primitive_cone_add(
        vertices=vertices,
        radius1=radius_bottom,
        radius2=radius_top,
        depth=depth,
        location=location,
        rotation=rotation,
    )
    object_ = bpy.context.object
    object_.name = name
    object_.data.name = f"{name}Mesh"
    apply_transform(object_)
    apply_bevel(object_, bevel)
    attach_material(object_, material)
    vary_uvs(object_, material)
    object_.parent = parent
    return object_


def create_sphere(
    name,
    radius,
    location,
    material,
    parent,
    scale=(1.0, 1.0, 1.0),
    segments=16,
    rings=8,
):
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=segments,
        ring_count=rings,
        radius=radius,
        location=location,
    )
    object_ = bpy.context.object
    object_.name = name
    object_.data.name = f"{name}Mesh"
    object_.scale = scale
    apply_transform(object_)
    attach_material(object_, material)
    vary_uvs(object_, material)
    object_.parent = parent
    return object_


def create_torus(
    name,
    major_radius,
    minor_radius,
    location,
    material,
    parent,
    rotation=(0.0, 0.0, 0.0),
    major_segments=16,
    minor_segments=6,
):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major_radius,
        minor_radius=minor_radius,
        major_segments=major_segments,
        minor_segments=minor_segments,
        location=location,
        rotation=rotation,
    )
    object_ = bpy.context.object
    object_.name = name
    object_.data.name = f"{name}Mesh"
    apply_transform(object_)
    attach_material(object_, material)
    vary_uvs(object_, material)
    object_.parent = parent
    return object_


def create_curve_tube(
    name,
    points,
    radius,
    material,
    parent,
    resolution=2,
):
    curve_data = bpy.data.curves.new(name=f"{name}Curve", type="CURVE")
    curve_data.dimensions = "3D"
    curve_data.resolution_u = resolution
    curve_data.bevel_depth = radius
    curve_data.bevel_resolution = 2
    curve_data.resolution_u = 2

    spline = curve_data.splines.new(type="BEZIER")
    spline.bezier_points.add(len(points) - 1)

    for bezier_point, point in zip(spline.bezier_points, points):
        bezier_point.co = point
        bezier_point.handle_left_type = "AUTO"
        bezier_point.handle_right_type = "AUTO"

    curve_object = bpy.data.objects.new(name, curve_data)
    bpy.context.scene.collection.objects.link(curve_object)
    curve_object.data.materials.append(material)
    curve_object.parent = parent

    bpy.context.view_layer.objects.active = curve_object
    curve_object.select_set(True)
    bpy.ops.object.convert(target="MESH")
    curve_object.select_set(False)
    curve_object.data.name = f"{name}Mesh"
    vary_uvs(curve_object, material)
    return curve_object


def create_mesh_object(
    name,
    vertices,
    faces,
    material,
    parent,
    uv_coordinates=None,
):
    mesh = bpy.data.meshes.new(f"{name}Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()

    object_ = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(object_)
    attach_material(object_, material)
    object_.parent = parent

    if uv_coordinates is not None:
        uv_layer = mesh.uv_layers.new(name="UVMap")

        for loop, uv in zip(mesh.loops, uv_coordinates):
            uv_layer.data[loop.index].uv = uv

        vary_uvs(object_, material)

    return object_


def smart_project(object_):
    bpy.ops.object.select_all(action="DESELECT")
    object_.select_set(True)
    bpy.context.view_layer.objects.active = object_
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(
        angle_limit=radians(66),
        island_margin=0.025,
    )
    bpy.ops.object.mode_set(mode="OBJECT")
    object_.select_set(False)

    if object_.data.materials:
        vary_uvs(object_, object_.data.materials[0])


def join_asset_meshes(root, mesh_name):
    mesh_objects = [
        child
        for child in root.children_recursive
        if child.type == "MESH"
    ]

    if not mesh_objects:
        raise RuntimeError(f"Asset has no mesh objects: {root.name}")

    bpy.ops.object.select_all(action="DESELECT")

    for object_ in mesh_objects:
        object_.select_set(True)

    active_object = mesh_objects[0]
    bpy.context.view_layer.objects.active = active_object
    bpy.ops.object.join()
    active_object.name = mesh_name
    active_object.data.name = f"{mesh_name}Mesh"

    cursor_location = bpy.context.scene.cursor.location.copy()
    bpy.context.scene.cursor.location = (0.0, 0.0, 0.0)
    bpy.ops.object.origin_set(type="ORIGIN_CURSOR")
    bpy.context.scene.cursor.location = cursor_location

    active_object.parent = root
    active_object.matrix_parent_inverse = Matrix.Identity(4)
    active_object.location = (0.0, 0.0, 0.0)
    active_object.rotation_euler = (0.0, 0.0, 0.0)
    active_object.scale = (1.0, 1.0, 1.0)
    active_object.select_set(False)
    return active_object


def finalize_asset(root, catalog_location):
    mesh = join_asset_meshes(root, f"{root.name}Geometry")
    root["triangle_count"] = sum(
        len(polygon.vertices) - 2 for polygon in mesh.data.polygons
    )
    root["origin"] = "bottom_center"
    root.location = catalog_location
    ASSET_MESHES[root.name] = mesh
    return root


def instance_asset(
    asset_name,
    parent,
    instance_name,
    location,
    rotation=(0.0, 0.0, 0.0),
    scale=(1.0, 1.0, 1.0),
    linked=True,
):
    source_mesh = ASSET_MESHES[asset_name]
    instance = source_mesh.copy()
    instance.data = (
        source_mesh.data
        if linked
        else source_mesh.data.copy()
    )
    instance.name = instance_name
    bpy.context.scene.collection.objects.link(instance)
    instance.parent = parent
    instance.matrix_parent_inverse = Matrix.Identity(4)
    instance.location = location
    instance.rotation_euler = rotation
    instance.scale = scale
    return instance


def create_stone_wall_module(name, seed, catalog_location):
    root = create_root(name, "architecture")
    randomizer = Random(seed)
    wall_length = 4.5
    wall_height = 3.2
    course_height = 0.64

    create_box(
        f"{name}MortarCore",
        (0.62, wall_length, wall_height),
        (0.0, 0.0, wall_height / 2),
        MATERIALS["stone_dark"],
        root,
        bevel=0.02,
    )

    for course in range(5):
        course_bottom = course * course_height
        y_cursor = -wall_length / 2 - (0.42 if course % 2 else 0.0)
        block_index = 0

        while y_cursor < wall_length / 2:
            block_length = randomizer.uniform(0.72, 1.08)
            block_center = y_cursor + block_length / 2
            clipped_start = max(y_cursor, -wall_length / 2)
            clipped_end = min(y_cursor + block_length, wall_length / 2)
            visible_length = clipped_end - clipped_start

            if visible_length > 0.16:
                create_box(
                    f"{name}Block_{course:02d}_{block_index:02d}",
                    (
                        0.11 + randomizer.uniform(-0.012, 0.018),
                        visible_length - 0.035,
                        course_height - randomizer.uniform(0.035, 0.075),
                    ),
                    (
                        0.355 + randomizer.uniform(-0.008, 0.018),
                        (clipped_start + clipped_end) / 2,
                        course_bottom
                        + course_height / 2
                        + randomizer.uniform(-0.012, 0.012),
                    ),
                    MATERIALS["stone"],
                    root,
                    bevel=0.026,
                    rotation=(
                        randomizer.uniform(-0.007, 0.007),
                        randomizer.uniform(-0.01, 0.01),
                        randomizer.uniform(-0.006, 0.006),
                    ),
                )

            y_cursor += block_length
            block_index += 1

    create_box(
        f"{name}UpperCourse",
        (0.78, wall_length + 0.08, 0.22),
        (0.08, 0.0, 3.11),
        MATERIALS["stone_worn"],
        root,
        bevel=0.035,
    )
    return finalize_asset(root, catalog_location)


def create_stone_plinth(catalog_location):
    root = create_root("StoneBaseMolding", "architecture")

    create_box(
        "PlinthLower",
        (0.9, 4.5, 0.18),
        (0.12, 0.0, 0.09),
        MATERIALS["stone"],
        root,
        bevel=0.025,
    )
    create_box(
        "PlinthMiddle",
        (0.74, 4.5, 0.2),
        (0.08, 0.0, 0.28),
        MATERIALS["stone_worn"],
        root,
        bevel=0.028,
    )
    create_box(
        "PlinthUpper",
        (0.58, 4.5, 0.19),
        (0.02, 0.0, 0.475),
        MATERIALS["stone"],
        root,
        bevel=0.022,
    )
    return finalize_asset(root, catalog_location)


def create_wall_support(catalog_location):
    root = create_root("WallSupport", "architecture")

    create_box(
        "SupportBaseLower",
        (0.86, 0.82, 0.2),
        (0.0, 0.0, 0.1),
        MATERIALS["stone"],
        root,
        bevel=0.035,
    )
    create_box(
        "SupportBaseUpper",
        (0.72, 0.68, 0.23),
        (0.0, 0.0, 0.315),
        MATERIALS["stone_worn"],
        root,
        bevel=0.03,
    )
    create_box(
        "SupportShaft",
        (0.56, 0.54, 2.62),
        (0.0, 0.0, 1.72),
        MATERIALS["stone"],
        root,
        bevel=0.045,
    )
    create_box(
        "SupportNeck",
        (0.65, 0.63, 0.2),
        (0.0, 0.0, 3.12),
        MATERIALS["stone_worn"],
        root,
        bevel=0.03,
    )
    create_box(
        "SupportCapital",
        (0.88, 0.82, 0.28),
        (0.0, 0.0, 3.36),
        MATERIALS["stone"],
        root,
        bevel=0.045,
    )
    return finalize_asset(root, catalog_location)


def create_floor_slab_module(catalog_location):
    root = create_root("FloorSlabModule", "architecture")
    randomizer = Random(401)
    width = 5.0
    length = 4.5
    columns = 4
    rows = 5
    slab_width = width / columns
    slab_length = length / rows

    for row in range(rows):
        for column in range(columns):
            x_position = (
                -width / 2
                + slab_width * (column + 0.5)
                + (0.1 if row % 2 else -0.04)
            )
            y_position = -length / 2 + slab_length * (row + 0.5)
            x_position += randomizer.uniform(-0.035, 0.035)
            y_position += randomizer.uniform(-0.035, 0.035)

            create_box(
                f"FloorSlab_{row:02d}_{column:02d}",
                (
                    slab_width - randomizer.uniform(0.055, 0.11),
                    slab_length - randomizer.uniform(0.055, 0.11),
                    randomizer.uniform(0.07, 0.11),
                ),
                (
                    x_position,
                    y_position,
                    randomizer.uniform(-0.012, 0.012),
                ),
                MATERIALS["floor"],
                root,
                bevel=0.035,
                rotation=(
                    randomizer.uniform(-0.006, 0.006),
                    randomizer.uniform(-0.006, 0.006),
                    randomizer.uniform(-0.012, 0.012),
                ),
            )

    return finalize_asset(root, catalog_location)


def create_barrel_vault(catalog_location):
    root = create_root("BarrelVaultModule", "architecture")
    inner_radius = 2.5
    outer_radius = 2.82
    spring_height = 3.15
    length = 4.5
    segments = 18
    vertices = []
    faces = []

    for y_position in (-length / 2, length / 2):
        for radius in (inner_radius, outer_radius):
            for index in range(segments + 1):
                angle = pi * index / segments
                vertices.append(
                    (
                        radius * cos(angle),
                        y_position,
                        spring_height + radius * sin(angle),
                    )
                )

    ring_size = segments + 1

    def vertex_index(y_index, radius_index, segment_index):
        return (
            y_index * ring_size * 2
            + radius_index * ring_size
            + segment_index
        )

    for index in range(segments):
        faces.append(
            (
                vertex_index(0, 0, index),
                vertex_index(1, 0, index),
                vertex_index(1, 0, index + 1),
                vertex_index(0, 0, index + 1),
            )
        )
        faces.append(
            (
                vertex_index(0, 1, index + 1),
                vertex_index(1, 1, index + 1),
                vertex_index(1, 1, index),
                vertex_index(0, 1, index),
            )
        )
        faces.append(
            (
                vertex_index(0, 0, index + 1),
                vertex_index(0, 1, index + 1),
                vertex_index(0, 1, index),
                vertex_index(0, 0, index),
            )
        )
        faces.append(
            (
                vertex_index(1, 0, index),
                vertex_index(1, 1, index),
                vertex_index(1, 1, index + 1),
                vertex_index(1, 0, index + 1),
            )
        )

    for segment_index in (0, segments):
        faces.append(
            (
                vertex_index(0, 0, segment_index),
                vertex_index(0, 1, segment_index),
                vertex_index(1, 1, segment_index),
                vertex_index(1, 0, segment_index),
            )
        )

    vault = create_mesh_object(
        "BarrelVaultShell",
        vertices,
        faces,
        MATERIALS["stone"],
        root,
    )
    smart_project(vault)
    apply_bevel(vault, 0.018)

    for y_position in (-2.15, 2.15):
        create_arch_ring_detail(
            root,
            f"VaultRib_{'Front' if y_position < 0 else 'Back'}",
            y_position,
            spring_height,
            inner_radius - 0.04,
            inner_radius + 0.16,
            0.18,
            15,
        )

    return finalize_asset(root, catalog_location)


def create_arch_wedge(
    parent,
    name,
    angle_start,
    angle_end,
    inner_radius,
    outer_radius,
    spring_height,
    depth,
    material,
):
    front = -depth / 2
    back = depth / 2
    vertices = []

    for y_position in (front, back):
        for radius, angle in (
            (inner_radius, angle_start),
            (inner_radius, angle_end),
            (outer_radius, angle_end),
            (outer_radius, angle_start),
        ):
            vertices.append(
                (
                    radius * cos(angle),
                    y_position,
                    spring_height + radius * sin(angle),
                )
            )

    faces = [
        (0, 1, 2, 3),
        (7, 6, 5, 4),
        (0, 4, 5, 1),
        (1, 5, 6, 2),
        (2, 6, 7, 3),
        (3, 7, 4, 0),
    ]
    wedge = create_mesh_object(
        name,
        vertices,
        faces,
        material,
        parent,
    )
    smart_project(wedge)
    apply_bevel(wedge, 0.018)
    return wedge


def create_arch_ring_detail(
    parent,
    name_prefix,
    y_position,
    spring_height,
    inner_radius,
    outer_radius,
    depth,
    segment_count,
):
    gap = 0.012

    for index in range(segment_count):
        start = index * pi / segment_count + gap
        end = (index + 1) * pi / segment_count - gap
        wedge = create_arch_wedge(
            parent,
            f"{name_prefix}_{index:02d}",
            start,
            end,
            inner_radius,
            outer_radius,
            spring_height,
            depth,
            MATERIALS["stone_worn" if index % 4 == 0 else "stone"],
        )
        wedge.location.y = y_position


def create_arch_asset(
    name,
    catalog_location,
    total_width,
    total_height,
    opening_width,
    opening_height,
    depth,
    include_wall,
):
    root = create_root(name, "architecture")
    inner_radius = opening_width / 2
    ring_thickness = 0.48 if include_wall else 0.34
    outer_radius = inner_radius + ring_thickness
    spring_height = opening_height - inner_radius
    segment_count = 13

    if include_wall:
        side_width = total_width / 2 - outer_radius
        side_center = outer_radius + side_width / 2

        for side in (-1, 1):
            create_box(
                f"{name}Wall_{side}",
                (side_width, depth, total_height),
                (side * side_center, 0.0, total_height / 2),
                MATERIALS["stone"],
                root,
                bevel=0.025,
            )

        cap_height = total_height - (spring_height + outer_radius)

        if cap_height > 0.08:
            create_box(
                f"{name}UpperWall",
                (
                    outer_radius * 2,
                    depth,
                    cap_height,
                ),
                (
                    0.0,
                    0.0,
                    spring_height + outer_radius + cap_height / 2,
                ),
                MATERIALS["stone"],
                root,
                bevel=0.025,
            )

    course_count = max(4, round(spring_height / 0.58))
    course_height = spring_height / course_count

    for side in (-1, 1):
        for course in range(course_count):
            create_box(
                f"{name}Jamb_{side}_{course:02d}",
                (
                    ring_thickness,
                    depth + 0.08,
                    course_height - 0.025,
                ),
                (
                    side * (inner_radius + ring_thickness / 2),
                    0.0,
                    course_height * (course + 0.5),
                ),
                MATERIALS["stone_worn" if course % 4 == 1 else "stone"],
                root,
                bevel=0.024,
            )

        create_box(
            f"{name}Capital_{side}",
            (ring_thickness + 0.25, depth + 0.18, 0.22),
            (
                side * (inner_radius + ring_thickness / 2),
                0.0,
                spring_height + 0.03,
            ),
            MATERIALS["stone_worn"],
            root,
            bevel=0.032,
        )
        create_box(
            f"{name}Base_{side}",
            (ring_thickness + 0.22, depth + 0.15, 0.22),
            (
                side * (inner_radius + ring_thickness / 2),
                0.0,
                0.11,
            ),
            MATERIALS["stone_worn"],
            root,
            bevel=0.032,
        )

    gap = 0.012

    for index in range(segment_count):
        start = index * pi / segment_count + gap
        end = (index + 1) * pi / segment_count - gap
        create_arch_wedge(
            root,
            f"{name}Voussoir_{index:02d}",
            start,
            end,
            inner_radius,
            outer_radius,
            spring_height,
            depth + 0.12,
            MATERIALS["stone_worn" if index % 5 == 0 else "stone"],
        )

    inner_trim_outer = inner_radius + 0.14

    for index in range(segment_count):
        start = index * pi / segment_count + 0.018
        end = (index + 1) * pi / segment_count - 0.018
        create_arch_wedge(
            root,
            f"{name}InnerTrim_{index:02d}",
            start,
            end,
            inner_radius,
            inner_trim_outer,
            spring_height,
            depth + 0.2,
            MATERIALS["stone_worn"],
        )

    return finalize_asset(root, catalog_location)


def create_book_asset(
    name,
    width,
    depth,
    height,
    cover_material,
    catalog_location,
    band_count=0,
):
    root = create_root(name, "books_and_paper")
    cover_thickness = 0.014

    create_box(
        f"{name}PageBlock",
        (width - 0.026, depth - 0.032, height - 0.052),
        (0.0, 0.012, height / 2),
        MATERIALS["paper_light"],
        root,
        bevel=0.008,
    )

    for side in (-1, 1):
        create_box(
            f"{name}Cover_{side}",
            (cover_thickness, depth, height),
            (side * width / 2, 0.0, height / 2),
            cover_material,
            root,
            bevel=0.006,
        )

    create_box(
        f"{name}Spine",
        (width, cover_thickness * 1.8, height),
        (0.0, -depth / 2, height / 2),
        cover_material,
        root,
        bevel=0.007,
    )

    for band_index in range(band_count):
        height_fraction = (band_index + 1) / (band_count + 1)
        create_box(
            f"{name}Band_{band_index:02d}",
            (width * 0.84, 0.012, 0.018),
            (
                0.0,
                -depth / 2 - 0.016,
                height * height_fraction,
            ),
            MATERIALS["brass"],
            root,
            bevel=0.003,
        )

    return finalize_asset(root, catalog_location)


def create_curved_sheet(
    name,
    width,
    length,
    location,
    material,
    parent,
    curl=0.025,
    wave=0.012,
    rotation=(0.0, 0.0, 0.0),
):
    x_segments = 4
    y_segments = 5
    vertices = []
    faces = []
    uv_coordinates = []

    for y_index in range(y_segments + 1):
        v = y_index / y_segments

        for x_index in range(x_segments + 1):
            u = x_index / x_segments
            x_position = (u - 0.5) * width
            y_position = (v - 0.5) * length
            z_position = (
                location[2]
                + curl * (abs(u - 0.5) * 2) ** 1.7
                + wave * sin(v * pi * 2)
            )
            vertices.append(
                (
                    location[0] + x_position,
                    location[1] + y_position,
                    z_position,
                )
            )

    row_size = x_segments + 1

    for y_index in range(y_segments):
        for x_index in range(x_segments):
            lower_left = y_index * row_size + x_index
            lower_right = lower_left + 1
            upper_left = lower_left + row_size
            upper_right = upper_left + 1
            faces.append(
                (lower_left, lower_right, upper_right, upper_left)
            )
            u0 = x_index / x_segments
            u1 = (x_index + 1) / x_segments
            v0 = y_index / y_segments
            v1 = (y_index + 1) / y_segments
            uv_coordinates.extend(
                ((u0, v0), (u1, v0), (u1, v1), (u0, v1))
            )

    sheet = create_mesh_object(
        name,
        vertices,
        faces,
        material,
        parent,
        uv_coordinates=uv_coordinates,
    )
    sheet.rotation_euler = rotation

    solidify = sheet.modifiers.new(name="PaperThickness", type="SOLIDIFY")
    solidify.thickness = 0.003
    bpy.context.view_layer.objects.active = sheet
    sheet.select_set(True)
    bpy.ops.object.modifier_apply(modifier=solidify.name)
    sheet.select_set(False)
    return sheet


def create_open_book(catalog_location):
    root = create_root("OpenBook", "books_and_paper")
    total_width = 0.62
    page_depth = 0.42

    create_box(
        "OpenBookLeftCover",
        (total_width / 2, page_depth, 0.025),
        (-total_width / 4, 0.0, 0.032),
        MATERIALS["leather"],
        root,
        bevel=0.01,
        rotation=(0.0, -0.055, 0.0),
    )
    create_box(
        "OpenBookRightCover",
        (total_width / 2, page_depth, 0.025),
        (total_width / 4, 0.0, 0.032),
        MATERIALS["leather"],
        root,
        bevel=0.01,
        rotation=(0.0, 0.055, 0.0),
    )

    for page_index in range(3):
        height_offset = 0.052 + page_index * 0.008
        create_curved_sheet(
            f"OpenBookLeftPage_{page_index:02d}",
            total_width / 2 - 0.018,
            page_depth - 0.025,
            (-total_width / 4 + 0.006, 0.0, height_offset),
            MATERIALS[
                "paper_light" if page_index % 2 == 0 else "paper"
            ],
            root,
            curl=0.045 + page_index * 0.006,
            wave=0.004,
            rotation=(0.0, -0.045, 0.0),
        )
        create_curved_sheet(
            f"OpenBookRightPage_{page_index:02d}",
            total_width / 2 - 0.018,
            page_depth - 0.025,
            (total_width / 4 - 0.006, 0.0, height_offset),
            MATERIALS[
                "paper" if page_index % 2 == 0 else "paper_light"
            ],
            root,
            curl=0.04 + page_index * 0.005,
            wave=-0.004,
            rotation=(0.0, 0.045, 0.0),
        )

    create_cylinder(
        "OpenBookSpine",
        0.025,
        page_depth,
        (0.0, 0.0, 0.055),
        MATERIALS["leather"],
        root,
        vertices=12,
        bevel=0.004,
        rotation=(pi / 2, 0.0, 0.0),
    )
    return finalize_asset(root, catalog_location)


def create_loose_papers(catalog_location):
    root = create_root("LoosePapers", "books_and_paper")
    placements = [
        ((0.0, 0.0, 0.012), 0.04, 0.014, 0.0),
        ((0.05, -0.07, 0.022), 0.025, -0.01, 0.11),
        ((-0.06, 0.05, 0.032), 0.05, 0.008, -0.08),
        ((0.12, 0.03, 0.042), 0.035, -0.008, 0.18),
    ]

    for index, (location, curl, wave, z_rotation) in enumerate(placements):
        create_curved_sheet(
            f"LoosePaper_{index:02d}",
            0.4 - index * 0.012,
            0.56 - index * 0.018,
            location,
            MATERIALS["paper_light" if index % 2 == 0 else "paper"],
            root,
            curl=curl,
            wave=wave,
            rotation=(0.0, 0.0, z_rotation),
        )

    return finalize_asset(root, catalog_location)


def create_notebook(catalog_location):
    root = create_root("Notebook", "books_and_paper")

    create_box(
        "NotebookPageBlock",
        (0.39, 0.29, 0.045),
        (0.0, 0.0, 0.035),
        MATERIALS["paper_light"],
        root,
        bevel=0.008,
    )
    create_box(
        "NotebookLowerCover",
        (0.43, 0.32, 0.018),
        (0.0, 0.0, 0.01),
        MATERIALS["leather_green"],
        root,
        bevel=0.009,
    )
    create_box(
        "NotebookUpperCover",
        (0.43, 0.32, 0.018),
        (0.0, -0.006, 0.07),
        MATERIALS["leather_green"],
        root,
        bevel=0.009,
        rotation=(0.012, -0.018, 0.0),
    )

    for y_position in (-0.105, 0.105):
        create_torus(
            f"NotebookBinding_{y_position}",
            0.025,
            0.006,
            (-0.225, y_position, 0.045),
            MATERIALS["brass"],
            root,
            rotation=(pi / 2, 0.0, 0.0),
            major_segments=10,
            minor_segments=5,
        )

    return finalize_asset(root, catalog_location)


def create_book_stack(name, catalog_location, book_names, tall=False):
    root = create_root(name, "books_and_paper")
    z_position = 0.0

    for index, book_name in enumerate(book_names):
        thickness = 0.09 + (index % 3) * 0.014
        z_position += thickness / 2
        instance_asset(
            book_name,
            root,
            f"{name}Book_{index:02d}",
            (
                (index % 3 - 1) * 0.035,
                (index % 2) * 0.025,
                z_position,
            ),
            rotation=(
                0.0,
                pi / 2,
                (-0.04 + index * 0.016) if tall else index * 0.012,
            ),
            scale=(
                0.9 + (index % 2) * 0.08,
                0.92 + (index % 3) * 0.035,
                0.84 + (index % 4) * 0.04,
            ),
            linked=False,
        )
        z_position += thickness / 2

    return finalize_asset(root, catalog_location)


def create_bookshelf(
    name,
    catalog_location,
    width,
    height,
    shelf_count,
    book_names,
):
    root = create_root(name, "furniture_and_storage")
    depth = 0.46
    post_width = 0.13

    create_box(
        f"{name}Back",
        (width - 0.18, 0.055, height - 0.28),
        (0.0, depth / 2 - 0.03, height / 2),
        MATERIALS["wood_dark"],
        root,
        bevel=0.012,
    )

    for side in (-1, 1):
        create_box(
            f"{name}SidePanel_{side}",
            (post_width, depth, height - 0.18),
            (
                side * (width / 2 - post_width / 2),
                0.0,
                height / 2,
            ),
            MATERIALS["wood"],
            root,
            bevel=0.025,
        )
        create_box(
            f"{name}FrontPost_{side}",
            (0.11, 0.12, height - 0.1),
            (
                side * (width / 2 - 0.055),
                -depth / 2 + 0.03,
                height / 2,
            ),
            MATERIALS["wood_dark"],
            root,
            bevel=0.025,
        )

    shelf_heights = [
        0.16 + index * ((height - 0.43) / shelf_count)
        for index in range(shelf_count + 1)
    ]

    for shelf_index, shelf_height in enumerate(shelf_heights):
        create_box(
            f"{name}Shelf_{shelf_index:02d}",
            (width - post_width * 1.5, depth, 0.075),
            (0.0, 0.0, shelf_height),
            MATERIALS["wood"],
            root,
            bevel=0.015,
        )
        create_box(
            f"{name}ShelfLip_{shelf_index:02d}",
            (width - post_width, 0.07, 0.105),
            (0.0, -depth / 2 - 0.012, shelf_height),
            MATERIALS["wood_dark"],
            root,
            bevel=0.018,
        )

    create_box(
        f"{name}CrownLower",
        (width + 0.12, depth + 0.08, 0.14),
        (0.0, 0.0, height - 0.11),
        MATERIALS["wood"],
        root,
        bevel=0.03,
    )
    create_box(
        f"{name}CrownUpper",
        (width + 0.24, depth + 0.12, 0.11),
        (0.0, -0.01, height - 0.015),
        MATERIALS["wood_dark"],
        root,
        bevel=0.028,
    )

    row_height = (height - 0.43) / shelf_count

    for row_index in range(shelf_count):
        x_position = -width / 2 + post_width + 0.09
        book_index = 0

        while x_position < width / 2 - post_width - 0.08:
            book_name = book_names[
                (book_index + row_index * 2) % len(book_names)
            ]
            source_width = 0.105 + ((book_index + row_index) % 3) * 0.018
            book_height_scale = min(
                1.0,
                (row_height - 0.12)
                / (0.42 + ((book_index + row_index) % 2) * 0.06),
            )
            pulled = (book_index + row_index * 3) % 7 == 0
            tilted = (book_index + row_index) % 5 == 0
            x_position += source_width / 2

            instance_asset(
                book_name,
                root,
                f"{name}Book_{row_index:02d}_{book_index:02d}",
                (
                    x_position,
                    -depth / 2 - (0.025 if pulled else -0.015),
                    shelf_heights[row_index] + 0.055,
                ),
                rotation=(
                    0.0,
                    radians(-7 if tilted else 0),
                    0.0,
                ),
                scale=(1.0, 1.0, book_height_scale),
                linked=False,
            )
            x_position += source_width / 2 + 0.018
            book_index += 1

    return finalize_asset(root, catalog_location)


def create_turned_leg(parent, name, x_position, y_position):
    create_cylinder(
        f"{name}Foot",
        0.075,
        0.12,
        (x_position, y_position, 0.06),
        MATERIALS["wood_dark"],
        parent,
        vertices=12,
        bevel=0.012,
    )
    create_cone(
        f"{name}Lower",
        0.065,
        0.05,
        0.3,
        (x_position, y_position, 0.27),
        MATERIALS["wood"],
        parent,
        vertices=12,
        bevel=0.01,
    )
    create_cylinder(
        f"{name}Knuckle",
        0.082,
        0.1,
        (x_position, y_position, 0.47),
        MATERIALS["wood_dark"],
        parent,
        vertices=12,
        bevel=0.012,
    )
    create_cone(
        f"{name}Upper",
        0.055,
        0.07,
        0.34,
        (x_position, y_position, 0.69),
        MATERIALS["wood"],
        parent,
        vertices=12,
        bevel=0.01,
    )


def create_reading_desk(catalog_location):
    root = create_root("ReadingDesk", "furniture_and_storage")

    for x_position in (-0.63, 0.63):
        for y_position in (-0.25, 0.25):
            create_turned_leg(
                root,
                f"DeskLeg_{x_position}_{y_position}",
                x_position,
                y_position,
            )

    create_box(
        "DeskFrontApron",
        (1.32, 0.09, 0.22),
        (0.0, -0.31, 0.73),
        MATERIALS["wood_dark"],
        root,
        bevel=0.018,
    )
    create_box(
        "DeskBackApron",
        (1.32, 0.09, 0.2),
        (0.0, 0.31, 0.73),
        MATERIALS["wood"],
        root,
        bevel=0.018,
    )
    create_box(
        "DeskTop",
        (1.58, 0.76, 0.11),
        (0.0, 0.0, 0.91),
        MATERIALS["wood"],
        root,
        bevel=0.035,
    )
    create_box(
        "DeskTopEdge",
        (1.66, 0.82, 0.055),
        (0.0, 0.0, 0.975),
        MATERIALS["wood_dark"],
        root,
        bevel=0.025,
    )
    create_box(
        "DeskDrawer",
        (0.48, 0.08, 0.18),
        (0.0, -0.365, 0.79),
        MATERIALS["wood"],
        root,
        bevel=0.018,
    )

    for x_position in (-0.13, 0.13):
        create_torus(
            f"DeskDrawerPull_{x_position}",
            0.045,
            0.009,
            (x_position, -0.415, 0.79),
            MATERIALS["brass"],
            root,
            rotation=(pi / 2, 0.0, 0.0),
            major_segments=12,
            minor_segments=5,
        )

    return finalize_asset(root, catalog_location)


def create_lectern(catalog_location):
    root = create_root("Lectern", "furniture_and_storage")

    create_box(
        "LecternBaseLower",
        (0.66, 0.58, 0.12),
        (0.0, 0.0, 0.06),
        MATERIALS["wood_dark"],
        root,
        bevel=0.025,
    )
    create_box(
        "LecternBaseUpper",
        (0.48, 0.42, 0.11),
        (0.0, 0.0, 0.17),
        MATERIALS["wood"],
        root,
        bevel=0.022,
    )
    create_cylinder(
        "LecternPost",
        0.105,
        0.78,
        (0.0, 0.0, 0.61),
        MATERIALS["wood"],
        root,
        vertices=8,
        bevel=0.015,
    )
    create_cylinder(
        "LecternPostCollar",
        0.15,
        0.11,
        (0.0, 0.0, 0.92),
        MATERIALS["wood_dark"],
        root,
        vertices=12,
        bevel=0.014,
    )
    create_box(
        "LecternPlatform",
        (0.74, 0.58, 0.08),
        (0.0, 0.0, 1.08),
        MATERIALS["wood"],
        root,
        bevel=0.025,
        rotation=(radians(13), 0.0, 0.0),
    )
    create_box(
        "LecternPageStop",
        (0.76, 0.055, 0.08),
        (0.0, -0.29, 1.02),
        MATERIALS["brass"],
        root,
        bevel=0.012,
        rotation=(radians(13), 0.0, 0.0),
    )
    return finalize_asset(root, catalog_location)


def create_destination_door(catalog_location):
    root = create_root("DestinationDoor", "architecture")

    create_box(
        "DestinationDoorRecess",
        (3.08, 0.22, 4.12),
        (0.0, 0.12, 2.06),
        MATERIALS["wood_dark"],
        root,
        bevel=0.025,
    )
    create_box(
        "DestinationDoorLeaf",
        (2.36, 0.18, 3.62),
        (0.0, -0.02, 1.81),
        MATERIALS["wood"],
        root,
        bevel=0.035,
    )

    for x_position in (-0.93, 0.0, 0.93):
        create_box(
            f"DestinationDoorStile_{x_position}",
            (0.15, 0.22, 3.42),
            (x_position, -0.035, 1.81),
            MATERIALS["wood_dark"],
            root,
            bevel=0.022,
        )

    for rail_index, z_position in enumerate(
        (0.18, 0.98, 1.89, 2.8, 3.44)
    ):
        create_box(
            f"DestinationDoorRail_{rail_index:02d}",
            (2.18, 0.225, 0.15),
            (0.0, -0.037, z_position),
            MATERIALS["wood_dark"],
            root,
            bevel=0.022,
        )

    panel_centers = (
        (-0.48, 0.58),
        (0.48, 0.58),
        (-0.48, 1.43),
        (0.48, 1.43),
        (-0.48, 2.34),
        (0.48, 2.34),
        (-0.48, 3.12),
        (0.48, 3.12),
    )

    for panel_index, (x_position, z_position) in enumerate(panel_centers):
        panel_height = 0.48 if panel_index >= 6 else 0.59
        create_box(
            f"DestinationDoorPanel_{panel_index:02d}",
            (0.7, 0.075, panel_height),
            (x_position, -0.145, z_position),
            MATERIALS["wood"],
            root,
            bevel=0.025,
        )
        create_box(
            f"DestinationDoorPanelInset_{panel_index:02d}",
            (0.54, 0.035, panel_height - 0.14),
            (x_position, -0.188, z_position),
            MATERIALS["wood_dark"],
            root,
            bevel=0.018,
        )

    for strap_index, z_position in enumerate((0.52, 2.74)):
        create_box(
            f"DestinationDoorIronStrap_{strap_index:02d}",
            (2.06, 0.045, 0.075),
            (0.0, -0.222, z_position),
            MATERIALS["iron"],
            root,
            bevel=0.012,
        )

        for rivet_index, x_position in enumerate(
            (-0.88, -0.46, 0.46, 0.88)
        ):
            create_cylinder(
                (
                    f"DestinationDoorRivet_{strap_index:02d}_"
                    f"{rivet_index:02d}"
                ),
                0.026,
                0.035,
                (x_position, -0.255, z_position),
                MATERIALS["iron"],
                root,
                vertices=10,
                bevel=0.004,
                rotation=(pi / 2, 0.0, 0.0),
            )

    create_box(
        "DestinationDoorLockPlate",
        (0.22, 0.045, 0.34),
        (0.24, -0.226, 1.71),
        MATERIALS["iron"],
        root,
        bevel=0.022,
    )
    create_torus(
        "DestinationDoorRingPull",
        0.13,
        0.018,
        (0.24, -0.27, 1.68),
        MATERIALS["brass"],
        root,
        rotation=(pi / 2, 0.0, 0.0),
        major_segments=18,
        minor_segments=6,
    )
    create_box(
        "DestinationDoorThreshold",
        (2.72, 0.58, 0.13),
        (0.0, -0.08, 0.065),
        MATERIALS["stone_worn"],
        root,
        bevel=0.03,
    )
    return finalize_asset(root, catalog_location)


def create_candle_asset(catalog_location):
    root = create_root("CandleSingle", "lighting_props")

    create_cylinder(
        "CandleHolderBase",
        0.12,
        0.026,
        (0.0, 0.0, 0.013),
        MATERIALS["brass"],
        root,
        vertices=16,
        bevel=0.006,
    )
    create_cone(
        "CandleHolderCup",
        0.085,
        0.115,
        0.055,
        (0.0, 0.0, 0.054),
        MATERIALS["brass"],
        root,
        vertices=16,
        bevel=0.006,
    )
    create_cylinder(
        "CandleWaxBody",
        0.046,
        0.34,
        (0.0, 0.0, 0.24),
        MATERIALS["wax"],
        root,
        vertices=18,
        bevel=0.008,
    )

    for index, (angle, length) in enumerate(
        ((0.3, 0.085), (2.35, 0.06), (4.25, 0.045))
    ):
        create_sphere(
            f"CandleWaxDrip_{index:02d}",
            0.033,
            (
                0.042 * cos(angle),
                0.042 * sin(angle),
                0.37 - length / 2,
            ),
            MATERIALS["wax"],
            root,
            scale=(0.42, 0.38, length / 0.066),
            segments=10,
            rings=6,
        )

    create_cylinder(
        "CandleWick",
        0.005,
        0.045,
        (0.0, 0.0, 0.432),
        MATERIALS["wick"],
        root,
        vertices=8,
        bevel=0.0,
    )
    create_sphere(
        "CandleFlame",
        0.055,
        (0.0, 0.0, 0.5),
        MATERIALS["flame"],
        root,
        scale=(0.43, 0.43, 1.25),
        segments=12,
        rings=7,
    )
    return finalize_asset(root, catalog_location)


def create_candle_cluster(catalog_location):
    root = create_root("CandleCluster", "lighting_props")

    create_cylinder(
        "CandleClusterTray",
        0.27,
        0.035,
        (0.0, 0.0, 0.018),
        MATERIALS["iron"],
        root,
        vertices=18,
        bevel=0.008,
    )

    placements = [
        ((-0.1, 0.04, 0.02), 1.08),
        ((0.09, 0.075, 0.02), 0.82),
        ((0.04, -0.1, 0.02), 0.95),
    ]

    for index, (location, scale) in enumerate(placements):
        instance_asset(
            "CandleSingle",
            root,
            f"CandleClusterCandle_{index:02d}",
            location,
            scale=(scale, scale, scale),
            linked=False,
        )

    create_sphere(
        "CandleClusterWaxPool",
        0.19,
        (0.0, 0.0, 0.047),
        MATERIALS["wax"],
        root,
        scale=(1.0, 0.82, 0.12),
        segments=14,
        rings=7,
    )
    return finalize_asset(root, catalog_location)


def create_hanging_lantern(catalog_location):
    root = create_root("HangingLantern", "lighting_props")
    body_center = 0.42
    body_radius = 0.24
    body_height = 0.58

    create_cylinder(
        "LanternLowerRing",
        body_radius,
        0.055,
        (0.0, 0.0, body_center - body_height / 2),
        MATERIALS["iron"],
        root,
        vertices=8,
        bevel=0.01,
    )
    create_cylinder(
        "LanternUpperRing",
        body_radius,
        0.055,
        (0.0, 0.0, body_center + body_height / 2),
        MATERIALS["iron"],
        root,
        vertices=8,
        bevel=0.01,
    )

    for corner_index in range(8):
        angle = corner_index * pi / 4
        x_position = body_radius * 0.91 * cos(angle)
        y_position = body_radius * 0.91 * sin(angle)
        create_cylinder(
            f"LanternPost_{corner_index:02d}",
            0.015,
            body_height,
            (x_position, y_position, body_center),
            MATERIALS["iron"],
            root,
            vertices=8,
            bevel=0.003,
        )

    for panel_index in range(4):
        angle = panel_index * pi / 2
        x_position = body_radius * 0.83 * cos(angle)
        y_position = body_radius * 0.83 * sin(angle)
        create_box(
            f"LanternGlass_{panel_index:02d}",
            (0.29, 0.015, 0.47),
            (x_position, y_position, body_center),
            MATERIALS["glass"],
            root,
            bevel=0.006,
            rotation=(0.0, 0.0, angle),
        )

    create_cone(
        "LanternRoof",
        0.31,
        0.09,
        0.26,
        (0.0, 0.0, 0.84),
        MATERIALS["iron"],
        root,
        vertices=8,
        bevel=0.012,
    )
    create_cylinder(
        "LanternRoofCap",
        0.07,
        0.09,
        (0.0, 0.0, 1.005),
        MATERIALS["brass"],
        root,
        vertices=12,
        bevel=0.009,
    )
    create_torus(
        "LanternHandle",
        0.16,
        0.016,
        (0.0, 0.0, 1.14),
        MATERIALS["iron"],
        root,
        rotation=(pi / 2, 0.0, 0.0),
        major_segments=18,
        minor_segments=6,
    )

    for link_index in range(3):
        create_torus(
            f"LanternChain_{link_index:02d}",
            0.055,
            0.011,
            (
                0.0,
                0.0,
                1.31 + link_index * 0.095,
            ),
            MATERIALS["iron"],
            root,
            rotation=(
                pi / 2 if link_index % 2 == 0 else 0.0,
                0.0,
                0.0,
            ),
            major_segments=12,
            minor_segments=5,
        )

    instance_asset(
        "CandleSingle",
        root,
        "LanternInteriorCandle",
        (0.0, 0.0, 0.14),
        scale=(0.62, 0.62, 0.72),
        linked=False,
    )
    return finalize_asset(root, catalog_location)


def create_wall_sconce(catalog_location):
    root = create_root("WallSconce", "lighting_props")

    create_box(
        "SconceWallPlate",
        (0.22, 0.055, 0.46),
        (0.0, 0.0, 0.34),
        MATERIALS["iron"],
        root,
        bevel=0.025,
    )
    create_torus(
        "SconcePlateDetail",
        0.085,
        0.012,
        (0.0, -0.035, 0.35),
        MATERIALS["brass"],
        root,
        rotation=(pi / 2, 0.0, 0.0),
        major_segments=14,
        minor_segments=5,
    )
    create_curve_tube(
        "SconceArm",
        (
            (0.0, -0.02, 0.28),
            (0.0, -0.16, 0.22),
            (0.0, -0.3, 0.31),
        ),
        0.018,
        MATERIALS["iron"],
        root,
    )
    create_cylinder(
        "SconceCandleCup",
        0.12,
        0.045,
        (0.0, -0.32, 0.33),
        MATERIALS["brass"],
        root,
        vertices=16,
        bevel=0.007,
    )
    instance_asset(
        "CandleSingle",
        root,
        "SconceCandle",
        (0.0, -0.32, 0.34),
        scale=(0.82, 0.82, 0.88),
        linked=False,
    )
    return finalize_asset(root, catalog_location)


def create_runner_asset(name, catalog_location, seed):
    root = create_root(name, "textile_and_dressing")
    randomizer = Random(seed)
    width = 1.45
    length = 4.25
    x_segments = 6
    y_segments = 18
    vertices = []
    faces = []
    uv_coordinates = []

    for y_index in range(y_segments + 1):
        v = y_index / y_segments
        edge_taper = 1.0 - 0.045 * sin(v * pi)

        for x_index in range(x_segments + 1):
            u = x_index / x_segments
            x_position = (u - 0.5) * width * edge_taper
            y_position = (v - 0.5) * length
            edge_lift = 0.012 * (abs(u - 0.5) * 2) ** 2
            z_position = (
                0.028
                + edge_lift
                + 0.006 * sin(v * pi * 5 + seed)
                + randomizer.uniform(-0.002, 0.002)
            )
            vertices.append((x_position, y_position, z_position))

    row_size = x_segments + 1

    for y_index in range(y_segments):
        for x_index in range(x_segments):
            lower_left = y_index * row_size + x_index
            lower_right = lower_left + 1
            upper_left = lower_left + row_size
            upper_right = upper_left + 1
            faces.append(
                (lower_left, lower_right, upper_right, upper_left)
            )
            u0 = x_index / x_segments
            u1 = (x_index + 1) / x_segments
            v0 = y_index / y_segments
            v1 = (y_index + 1) / y_segments
            uv_coordinates.extend(
                ((u0, v0), (u1, v0), (u1, v1), (u0, v1))
            )

    runner = create_mesh_object(
        f"{name}Textile",
        vertices,
        faces,
        MATERIALS["textile"],
        root,
        uv_coordinates=uv_coordinates,
    )
    solidify = runner.modifiers.new(name="RunnerThickness", type="SOLIDIFY")
    solidify.thickness = 0.012
    bpy.context.view_layer.objects.active = runner
    runner.select_set(True)
    bpy.ops.object.modifier_apply(modifier=solidify.name)
    runner.select_set(False)

    for end in (-1, 1):
        for fringe_index in range(13):
            x_position = -width / 2 + width * fringe_index / 12
            fringe_length = randomizer.uniform(0.085, 0.15)
            create_cylinder(
                f"{name}Fringe_{end}_{fringe_index:02d}",
                0.006,
                fringe_length,
                (
                    x_position,
                    end * (length / 2 + fringe_length / 2),
                    0.022,
                ),
                MATERIALS["textile"],
                root,
                vertices=6,
                bevel=0.0,
                rotation=(pi / 2, 0.0, 0.0),
            )

    return finalize_asset(root, catalog_location)


def create_leaf(parent, name, location, scale, rotation, material):
    width = 0.12 * scale
    height = 0.23 * scale
    vertices = [
        (location[0], location[1], location[2] - height / 2),
        (
            location[0] - width * 0.72,
            location[1] + 0.008,
            location[2] - height * 0.1,
        ),
        (
            location[0] - width * 0.55,
            location[1] + 0.012,
            location[2] + height * 0.22,
        ),
        (location[0], location[1], location[2] + height / 2),
        (
            location[0] + width * 0.55,
            location[1] - 0.01,
            location[2] + height * 0.22,
        ),
        (
            location[0] + width * 0.72,
            location[1] - 0.006,
            location[2] - height * 0.1,
        ),
    ]
    leaf = create_mesh_object(
        name,
        vertices,
        ((0, 1, 2, 3, 4, 5),),
        material,
        parent,
        uv_coordinates=(
            (0.5, 0.0),
            (0.0, 0.35),
            (0.08, 0.72),
            (0.5, 1.0),
            (0.92, 0.72),
            (1.0, 0.35),
        ),
    )
    leaf.rotation_euler = rotation

    solidify = leaf.modifiers.new(name="LeafThickness", type="SOLIDIFY")
    solidify.thickness = 0.004
    bpy.context.view_layer.objects.active = leaf
    leaf.select_set(True)
    bpy.ops.object.modifier_apply(modifier=solidify.name)
    leaf.select_set(False)
    return leaf


def create_ivy_asset(name, catalog_location, seed):
    root = create_root(name, "textile_and_dressing")
    randomizer = Random(seed)
    main_points = (
        (0.0, 0.0, 0.0),
        (0.08, 0.015, 0.62),
        (-0.12, -0.005, 1.25),
        (0.14, 0.012, 1.92),
        (-0.04, 0.0, 2.55),
    )
    create_curve_tube(
        f"{name}MainStem",
        main_points,
        0.018,
        MATERIALS["foliage_dry"],
        root,
    )
    create_curve_tube(
        f"{name}Branch",
        (
            (-0.06, 0.0, 1.1),
            (-0.38, 0.006, 1.42),
            (-0.54, 0.0, 1.72),
        ),
        0.011,
        MATERIALS["foliage_dry"],
        root,
    )

    for index in range(20):
        stem_position = index / 19
        z_position = 0.18 + stem_position * 2.3
        x_position = 0.1 * sin(stem_position * pi * 5)
        side = -1 if index % 2 == 0 else 1
        x_position += side * randomizer.uniform(0.08, 0.2)
        create_leaf(
            root,
            f"{name}Leaf_{index:02d}",
            (
                x_position,
                randomizer.uniform(-0.012, 0.018),
                z_position + randomizer.uniform(-0.05, 0.05),
            ),
            randomizer.uniform(0.72, 1.12),
            (
                randomizer.uniform(-0.16, 0.16),
                randomizer.uniform(-0.12, 0.12),
                side * randomizer.uniform(0.25, 0.72),
            ),
            MATERIALS[
                "foliage_dry" if index % 6 == 0 else "foliage"
            ],
        )

    return finalize_asset(root, catalog_location)


def create_archive_props(catalog_location):
    root = create_root("ArchiveProps", "textile_and_dressing")

    create_cylinder(
        "InkwellBody",
        0.075,
        0.11,
        (0.0, 0.0, 0.055),
        MATERIALS["iron"],
        root,
        vertices=10,
        bevel=0.012,
    )
    create_cylinder(
        "InkwellRim",
        0.055,
        0.035,
        (0.0, 0.0, 0.125),
        MATERIALS["brass"],
        root,
        vertices=12,
        bevel=0.006,
    )
    create_curve_tube(
        "QuillShaft",
        (
            (0.03, 0.0, 0.12),
            (0.11, 0.0, 0.31),
            (0.18, 0.0, 0.52),
        ),
        0.009,
        MATERIALS["brass"],
        root,
    )
    create_leaf(
        root,
        "QuillFeather",
        (0.19, 0.0, 0.56),
        1.15,
        (0.0, 0.0, -0.32),
        MATERIALS["paper_light"],
    )

    for index in range(3):
        create_cylinder(
            f"ArchiveScroll_{index:02d}",
            0.055,
            0.42 - index * 0.035,
            (
                0.36,
                -0.16 + index * 0.12,
                0.06 + index * 0.075,
            ),
            MATERIALS["paper"],
            root,
            vertices=12,
            bevel=0.008,
            rotation=(0.0, pi / 2, 0.0),
        )
        create_torus(
            f"ArchiveScrollTie_{index:02d}",
            0.058,
            0.008,
            (
                0.36,
                -0.16 + index * 0.12,
                0.06 + index * 0.075,
            ),
            MATERIALS["leather_umber"],
            root,
            rotation=(0.0, pi / 2, 0.0),
            major_segments=10,
            minor_segments=5,
        )

    return finalize_asset(root, catalog_location)


def create_side_clutter(
    name,
    catalog_location,
    stack_asset,
    include_candle,
):
    root = create_root(name, "textile_and_dressing")

    instance_asset(
        stack_asset,
        root,
        f"{name}Stack",
        (-0.12, 0.06, 0.0),
        rotation=(0.0, 0.0, -0.08),
        linked=False,
    )
    instance_asset(
        "OpenBook",
        root,
        f"{name}OpenBook",
        (0.3, -0.06, 0.04),
        rotation=(0.0, 0.0, 0.16),
        scale=(0.82, 0.82, 0.82),
        linked=False,
    )
    instance_asset(
        "LoosePapers",
        root,
        f"{name}Papers",
        (0.38, 0.28, 0.025),
        rotation=(0.0, 0.0, -0.14),
        scale=(0.88, 0.88, 0.88),
        linked=False,
    )
    instance_asset(
        "Notebook",
        root,
        f"{name}Notebook",
        (-0.38, -0.22, 0.04),
        rotation=(0.0, 0.0, 0.11),
        linked=False,
    )

    if include_candle:
        instance_asset(
            "CandleCluster",
            root,
            f"{name}Candles",
            (-0.42, 0.22, 0.02),
            scale=(0.78, 0.78, 0.78),
            linked=False,
        )

    return finalize_asset(root, catalog_location)


def create_asset_library():
    create_stone_wall_module(
        "StoneWallModuleA",
        101,
        (13.0, -8.0, 0.0),
    )
    create_stone_wall_module(
        "StoneWallModuleB",
        211,
        (13.0, -2.0, 0.0),
    )
    create_stone_plinth((13.0, 4.0, 0.0))
    create_wall_support((13.0, 10.0, 0.0))
    create_floor_slab_module((20.0, -8.0, 0.0))
    create_barrel_vault((20.0, -1.0, 0.0))
    create_arch_asset(
        "DeepArchModule",
        (20.0, 7.0, 0.0),
        total_width=6.0,
        total_height=5.3,
        opening_width=3.3,
        opening_height=4.4,
        depth=1.25,
        include_wall=True,
    )
    create_arch_asset(
        "DoorwayFrame",
        (20.0, 14.0, 0.0),
        total_width=4.4,
        total_height=4.7,
        opening_width=3.15,
        opening_height=4.08,
        depth=0.48,
        include_wall=False,
    )

    create_book_asset(
        "BookVariantA",
        0.105,
        0.28,
        0.43,
        MATERIALS["leather"],
        (29.0, -10.0, 0.0),
        band_count=2,
    )
    create_book_asset(
        "BookVariantB",
        0.125,
        0.3,
        0.5,
        MATERIALS["leather_green"],
        (29.4, -10.0, 0.0),
        band_count=3,
    )
    create_book_asset(
        "BookVariantC",
        0.085,
        0.25,
        0.38,
        MATERIALS["leather_umber"],
        (29.8, -10.0, 0.0),
        band_count=1,
    )
    create_book_asset(
        "BookVariantD",
        0.14,
        0.31,
        0.46,
        MATERIALS["leather"],
        (30.2, -10.0, 0.0),
        band_count=0,
    )
    create_open_book((29.0, -7.0, 0.0))
    create_loose_papers((30.0, -7.0, 0.0))
    create_notebook((31.0, -7.0, 0.0))
    create_book_stack(
        "BookStackLow",
        (29.0, -4.0, 0.0),
        (
            "BookVariantA",
            "BookVariantC",
            "BookVariantD",
            "BookVariantB",
        ),
    )
    create_book_stack(
        "BookStackTall",
        (31.0, -4.0, 0.0),
        (
            "BookVariantB",
            "BookVariantA",
            "BookVariantC",
            "BookVariantD",
            "BookVariantA",
            "BookVariantC",
            "BookVariantB",
        ),
        tall=True,
    )

    book_names = (
        "BookVariantA",
        "BookVariantB",
        "BookVariantC",
        "BookVariantD",
    )
    create_bookshelf(
        "BookshelfLarge",
        (29.0, 0.0, 0.0),
        width=1.85,
        height=2.52,
        shelf_count=4,
        book_names=book_names,
    )
    create_bookshelf(
        "BookshelfSmall",
        (32.0, 0.0, 0.0),
        width=1.28,
        height=1.72,
        shelf_count=3,
        book_names=book_names,
    )
    create_reading_desk((29.0, 5.0, 0.0))
    create_lectern((32.0, 5.0, 0.0))
    create_destination_door((33.0, 9.0, 0.0))

    create_candle_asset((37.0, -8.0, 0.0))
    create_candle_cluster((38.0, -8.0, 0.0))
    create_hanging_lantern((37.0, -4.0, 0.0))
    create_wall_sconce((39.0, -4.0, 0.0))

    create_runner_asset(
        "RunnerModuleA",
        (37.0, 1.0, 0.0),
        13,
    )
    create_runner_asset(
        "RunnerModuleB",
        (40.0, 1.0, 0.0),
        29,
    )
    create_ivy_asset("IvyModuleA", (37.0, 7.0, 0.0), 71)
    create_ivy_asset("IvyModuleB", (39.0, 7.0, 0.0), 103)
    create_archive_props((37.0, 11.0, 0.0))
    create_side_clutter(
        "SideClutterA",
        (39.0, 11.0, 0.0),
        "BookStackTall",
        include_candle=True,
    )
    create_side_clutter(
        "SideClutterB",
        (42.0, 11.0, 0.0),
        "BookStackLow",
        include_candle=False,
    )


def create_entrance_assembly():
    assembly = create_root("EntranceAssembly", "scene_assembly")
    assembly["scope"] = (
        "introductory vestibule, first corridor, first arch transition"
    )
    assembly["forward_axis"] = "+Y in Blender, -Z in React Three Fiber"
    bay_centers = (2.25, 6.75, 11.25, 15.75)

    for bay_index, y_position in enumerate(bay_centers):
        wall_asset = (
            "StoneWallModuleA"
            if bay_index % 2 == 0
            else "StoneWallModuleB"
        )
        runner_asset = (
            "RunnerModuleA"
            if bay_index % 2 == 0
            else "RunnerModuleB"
        )

        instance_asset(
            "FloorSlabModule",
            assembly,
            f"EntranceFloor_{bay_index:02d}",
            (0.0, y_position, 0.0),
            rotation=(0.0, 0.0, pi if bay_index % 2 else 0.0),
        )
        instance_asset(
            "BarrelVaultModule",
            assembly,
            f"EntranceVault_{bay_index:02d}",
            (0.0, y_position, 0.0),
            rotation=(0.0, 0.0, pi if bay_index % 2 else 0.0),
        )
        instance_asset(
            wall_asset,
            assembly,
            f"EntranceLeftWall_{bay_index:02d}",
            (-2.82, y_position, 0.0),
        )
        instance_asset(
            wall_asset,
            assembly,
            f"EntranceRightWall_{bay_index:02d}",
            (2.82, y_position, 0.0),
            rotation=(0.0, 0.0, pi),
        )
        instance_asset(
            "StoneBaseMolding",
            assembly,
            f"EntranceLeftPlinth_{bay_index:02d}",
            (-2.82, y_position, 0.0),
        )
        instance_asset(
            "StoneBaseMolding",
            assembly,
            f"EntranceRightPlinth_{bay_index:02d}",
            (2.82, y_position, 0.0),
            rotation=(0.0, 0.0, pi),
        )
        instance_asset(
            runner_asset,
            assembly,
            f"EntranceRunner_{bay_index:02d}",
            (0.0, y_position, 0.075),
            rotation=(0.0, 0.0, pi if bay_index % 2 else 0.0),
        )

    support_positions = (0.3, 4.5, 13.5, 17.55)

    for support_index, y_position in enumerate(support_positions):
        for side in (-1, 1):
            instance_asset(
                "WallSupport",
                assembly,
                (
                    f"EntranceSupport_{support_index:02d}_"
                    f"{'L' if side < 0 else 'R'}"
                ),
                (side * 2.35, y_position, 0.0),
                rotation=(0.0, 0.0, pi if side > 0 else 0.0),
            )

    instance_asset(
        "DeepArchModule",
        assembly,
        "VestibuleDeepArch",
        (0.0, 9.0, 0.0),
    )
    instance_asset(
        "DoorwayFrame",
        assembly,
        "CorridorDoorwayFrame",
        (0.0, 16.9, 0.0),
    )
    instance_asset(
        "DeepArchModule",
        assembly,
        "TurningDeepArch",
        (3.05, 18.0, 0.0),
        rotation=(0.0, 0.0, -pi / 2),
    )
    instance_asset(
        "DeepArchModule",
        assembly,
        "CorridorEndDeepArch",
        (0.0, 20.3, 0.0),
    )
    instance_asset(
        "DestinationDoor",
        assembly,
        "CorridorEndDoor",
        (0.0, 21.05, 0.0),
    )

    instance_asset(
        "ReadingDesk",
        assembly,
        "VestibuleReadingDesk",
        (-2.0, 3.1, 0.0),
        rotation=(0.0, 0.0, pi / 2),
    )
    instance_asset(
        "OpenBook",
        assembly,
        "DeskOpenBook",
        (-1.96, 3.15, 1.035),
        rotation=(0.0, 0.0, -0.08),
        scale=(0.92, 0.92, 0.92),
    )
    instance_asset(
        "LoosePapers",
        assembly,
        "DeskLoosePapers",
        (-1.97, 2.76, 1.025),
        rotation=(0.0, 0.0, 0.18),
        scale=(0.86, 0.86, 0.86),
    )
    instance_asset(
        "ArchiveProps",
        assembly,
        "DeskArchiveProps",
        (-1.85, 3.47, 1.025),
        rotation=(0.0, 0.0, -0.24),
        scale=(0.88, 0.88, 0.88),
    )
    instance_asset(
        "CandleCluster",
        assembly,
        "DeskCandleCluster",
        (-2.06, 3.52, 1.02),
        scale=(0.72, 0.72, 0.72),
    )
    instance_asset(
        "BookshelfLarge",
        assembly,
        "VestibuleBookshelf",
        (2.22, 5.85, 0.0),
        rotation=(0.0, 0.0, -pi / 2),
    )
    instance_asset(
        "BookStackLow",
        assembly,
        "VestibuleFloorBooks",
        (-2.02, 7.25, 0.02),
        rotation=(0.0, 0.0, 0.11),
        scale=(1.05, 1.05, 1.05),
    )
    instance_asset(
        "OpenBook",
        assembly,
        "VestibuleFloorOpenBook",
        (-1.73, 7.46, 0.07),
        rotation=(0.0, 0.0, -0.16),
        scale=(0.9, 0.9, 0.9),
    )
    instance_asset(
        "SideClutterA",
        assembly,
        "ArchSideClutter",
        (-1.98, 10.45, 0.02),
        rotation=(0.0, 0.0, 0.08),
        scale=(0.92, 0.92, 0.92),
    )
    instance_asset(
        "BookshelfSmall",
        assembly,
        "CorridorBookshelf",
        (-2.22, 13.35, 0.0),
        rotation=(0.0, 0.0, pi / 2),
    )
    instance_asset(
        "Lectern",
        assembly,
        "CorridorLectern",
        (2.0, 14.15, 0.0),
        rotation=(0.0, 0.0, -pi / 2),
    )
    instance_asset(
        "OpenBook",
        assembly,
        "LecternOpenBook",
        (1.98, 14.15, 1.17),
        rotation=(0.0, 0.0, -pi / 2),
        scale=(0.78, 0.78, 0.78),
    )
    instance_asset(
        "SideClutterB",
        assembly,
        "TransitionSideClutter",
        (2.02, 15.75, 0.02),
        rotation=(0.0, 0.0, -0.12),
        scale=(0.88, 0.88, 0.88),
    )

    instance_asset(
        "HangingLantern",
        assembly,
        "VestibuleHangingLantern",
        (0.0, 5.0, 3.58),
        scale=(0.92, 0.92, 0.92),
    )
    instance_asset(
        "HangingLantern",
        assembly,
        "CorridorHangingLantern",
        (0.0, 13.35, 3.48),
        rotation=(0.0, 0.0, pi / 4),
        scale=(0.84, 0.84, 0.84),
    )
    instance_asset(
        "WallSconce",
        assembly,
        "LeftWallSconce",
        (-2.42, 7.05, 1.55),
        rotation=(0.0, 0.0, pi / 2),
        scale=(0.86, 0.86, 0.86),
    )
    instance_asset(
        "WallSconce",
        assembly,
        "RightWallSconce",
        (2.42, 15.15, 1.52),
        rotation=(0.0, 0.0, -pi / 2),
        scale=(0.82, 0.82, 0.82),
    )
    instance_asset(
        "CandleSingle",
        assembly,
        "TransitionFloorCandle",
        (-2.08, 16.35, 0.02),
        scale=(0.82, 0.82, 0.82),
    )

    instance_asset(
        "IvyModuleA",
        assembly,
        "VestibuleLeftIvy",
        (-2.44, 1.0, 0.12),
        rotation=(0.0, 0.0, pi / 2),
        scale=(0.92, 0.92, 0.92),
    )
    instance_asset(
        "IvyModuleB",
        assembly,
        "ArchRightIvy",
        (2.43, 9.65, 0.35),
        rotation=(0.0, 0.0, -pi / 2),
        scale=(0.76, 0.76, 0.76),
    )
    instance_asset(
        "IvyModuleA",
        assembly,
        "TransitionLeftIvy",
        (-2.43, 15.4, 0.18),
        rotation=(0.0, 0.0, pi / 2),
        scale=(0.62, 0.62, 0.62),
    )

    return assembly


def look_at(object_, target):
    direction = Vector(target) - object_.location
    object_.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def create_preview_scene():
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x = 720
    scene.render.resolution_y = 720
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = str(PREVIEW_PATH)
    scene.world.color = (0.008, 0.01, 0.014)

    try:
        scene.view_settings.look = "AgX - Medium High Contrast"
    except TypeError:
        pass

    camera_data = bpy.data.cameras.new("EntrancePreviewCamera")
    camera = bpy.data.objects.new("EntrancePreviewCamera", camera_data)
    bpy.context.scene.collection.objects.link(camera)
    camera.location = (0.0, -1.45, 1.68)
    camera_data.lens = 34
    look_at(camera, (0.0, 10.8, 2.15))
    scene.camera = camera

    warm_area_data = bpy.data.lights.new(
        name="EntrancePreviewWarm",
        type="AREA",
    )
    warm_area_data.energy = 360
    warm_area_data.color = (1.0, 0.43, 0.16)
    warm_area_data.shape = "DISK"
    warm_area_data.size = 3.0
    warm_area = bpy.data.objects.new(
        "EntrancePreviewWarm",
        warm_area_data,
    )
    bpy.context.scene.collection.objects.link(warm_area)
    warm_area.location = (-1.8, 2.3, 3.2)
    look_at(warm_area, (0.0, 6.0, 1.4))

    cool_area_data = bpy.data.lights.new(
        name="EntrancePreviewCool",
        type="AREA",
    )
    cool_area_data.energy = 470
    cool_area_data.color = (0.42, 0.58, 0.72)
    cool_area_data.shape = "DISK"
    cool_area_data.size = 3.5
    cool_area = bpy.data.objects.new(
        "EntrancePreviewCool",
        cool_area_data,
    )
    bpy.context.scene.collection.objects.link(cool_area)
    cool_area.location = (0.0, 19.5, 4.4)
    look_at(cool_area, (0.0, 12.0, 1.3))

    bpy.ops.render.render(write_still=True)
    return camera


def scene_triangle_count():
    return sum(
        len(polygon.vertices) - 2
        for object_ in bpy.context.scene.objects
        if object_.type == "MESH"
        for polygon in object_.data.polygons
    )


def main():
    BLEND_PATH.parent.mkdir(parents=True, exist_ok=True)
    GLB_PATH.parent.mkdir(parents=True, exist_ok=True)

    clear_scene()
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0
    scene["pipeline"] = "blender_to_glb_to_react_three_fiber"
    scene["production_scope"] = (
        "introductory vestibule, first corridor, first arch transition"
    )

    create_material_library()
    create_asset_library()
    assembly = create_entrance_assembly()
    preview_camera = create_preview_scene()

    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.file.pack_all()
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))

    bpy.ops.object.select_all(action="DESELECT")
    assembly.select_set(True)

    for child in assembly.children_recursive:
        child.select_set(True)

    bpy.context.view_layer.objects.active = assembly
    bpy.ops.export_scene.gltf(
        filepath=str(GLB_PATH),
        export_format="GLB",
        use_selection=True,
        export_yup=True,
        export_apply=True,
        export_animations=False,
        export_cameras=False,
        export_lights=False,
        export_extras=True,
        export_image_format="AUTO",
        export_jpeg_quality=76,
    )

    mesh_objects = [
        object_
        for object_ in scene.objects
        if object_.type == "MESH"
    ]
    linked_instances = sum(
        1
        for object_ in assembly.children
        if object_.type == "MESH"
    )
    print(f"ENTRANCE_BLEND={BLEND_PATH}")
    print(f"ENTRANCE_GLB={GLB_PATH}")
    print(f"ENTRANCE_PREVIEW={PREVIEW_PATH}")
    print(f"ENTRANCE_ASSET_COUNT={len(ASSET_MESHES)}")
    print(f"ENTRANCE_MATERIAL_COUNT={len(MATERIALS)}")
    print(f"ENTRANCE_MESH_OBJECT_COUNT={len(mesh_objects)}")
    print(f"ENTRANCE_LINKED_INSTANCE_COUNT={linked_instances}")
    print(f"ENTRANCE_TRIANGLE_REFERENCES={scene_triangle_count()}")


if __name__ == "__main__":
    main()
