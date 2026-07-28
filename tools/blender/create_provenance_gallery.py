from math import cos, pi, radians, sin
from pathlib import Path
from random import Random
import sys

import bpy
from mathutils import Matrix, Vector


SCRIPT_DIR = Path(__file__).resolve().parent
ROOT = SCRIPT_DIR.parents[1]
BLEND_PATH = ROOT / "assets" / "blender" / "provenance_gallery.blend"
GLB_PATH = ROOT / "public" / "models" / "provenance-gallery.glb"
PREVIEW_PATH = Path("/tmp/provenance-gallery-preview.png")

if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

import create_entrance_asset_library as base


GALLERY_LENGTH = 7.5
GALLERY_WIDTH = 4.4
GALLERY_HEIGHT = 4.85
ROUTE_HALF_WIDTH = 0.95
PROP_GROUPS = []


def create_gallery_floor_bay(name, seed, catalog_location):
    root = base.create_root(name, "architecture")
    randomizer = Random(seed)
    bay_length = 2.5
    columns = 4
    rows = 3
    slab_width = GALLERY_WIDTH / columns
    slab_length = bay_length / rows

    for row in range(rows):
        for column in range(columns):
            x_position = (
                -GALLERY_WIDTH / 2
                + slab_width * (column + 0.5)
                + (0.08 if row % 2 else -0.03)
            )
            y_position = -bay_length / 2 + slab_length * (row + 0.5)
            x_position += randomizer.uniform(-0.025, 0.025)
            y_position += randomizer.uniform(-0.025, 0.025)

            base.create_box(
                f"{name}Slab_{row:02d}_{column:02d}",
                (
                    slab_width - randomizer.uniform(0.045, 0.085),
                    slab_length - randomizer.uniform(0.045, 0.085),
                    randomizer.uniform(0.075, 0.105),
                ),
                (
                    x_position,
                    y_position,
                    randomizer.uniform(-0.012, 0.01),
                ),
                base.MATERIALS["floor"],
                root,
                bevel=0.032,
                rotation=(
                    randomizer.uniform(-0.005, 0.005),
                    randomizer.uniform(-0.005, 0.005),
                    randomizer.uniform(-0.01, 0.01),
                ),
            )

    return base.finalize_asset(root, catalog_location)


def create_gallery_vault_bay(name, catalog_location):
    root = base.create_root(name, "architecture")
    inner_radius = GALLERY_WIDTH / 2
    outer_radius = inner_radius + 0.32
    spring_height = GALLERY_HEIGHT - inner_radius
    bay_length = 2.5
    segments = 16
    vertices = []
    faces = []

    for y_position in (-bay_length / 2, bay_length / 2):
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
        faces.extend(
            (
                (
                    vertex_index(0, 0, index),
                    vertex_index(1, 0, index),
                    vertex_index(1, 0, index + 1),
                    vertex_index(0, 0, index + 1),
                ),
                (
                    vertex_index(0, 1, index + 1),
                    vertex_index(1, 1, index + 1),
                    vertex_index(1, 1, index),
                    vertex_index(0, 1, index),
                ),
            )
        )

    vault = base.create_mesh_object(
        f"{name}Shell",
        vertices,
        faces,
        base.MATERIALS["stone"],
        root,
    )
    base.smart_project(vault)
    base.apply_bevel(vault, 0.018)

    for y_position in (-1.16, 1.16):
        base.create_arch_ring_detail(
            root,
            f"{name}Rib_{'Front' if y_position < 0 else 'Back'}",
            y_position,
            spring_height,
            inner_radius - 0.035,
            inner_radius + 0.14,
            0.15,
            13,
        )

    return base.finalize_asset(root, catalog_location)


def opening_overlaps(
    start,
    end,
    course_bottom,
    course_top,
    opening,
):
    if opening is None:
        return False

    y_min, y_max, z_min, z_max = opening
    return (
        start < y_max
        and end > y_min
        and course_bottom < z_max
        and course_top > z_min
    )


def create_gallery_wall_bay(
    name,
    seed,
    catalog_location,
    opening=None,
):
    root = base.create_root(name, "architecture")
    randomizer = Random(seed)
    bay_length = 2.5
    wall_height = GALLERY_HEIGHT - GALLERY_WIDTH / 2 + 0.12
    course_count = 5
    course_height = wall_height / course_count

    base.create_box(
        f"{name}OuterBacking",
        (0.16, bay_length, wall_height),
        (-0.31, 0.0, wall_height / 2),
        base.MATERIALS["stone_dark"],
        root,
        bevel=0.015,
    )

    for course in range(course_count):
        course_bottom = course * course_height
        course_top = course_bottom + course_height
        y_cursor = -bay_length / 2 - (0.34 if course % 2 else 0.0)
        block_index = 0

        while y_cursor < bay_length / 2:
            block_length = randomizer.uniform(0.62, 0.9)
            clipped_start = max(y_cursor, -bay_length / 2)
            clipped_end = min(y_cursor + block_length, bay_length / 2)
            visible_length = clipped_end - clipped_start

            if (
                visible_length > 0.14
                and not opening_overlaps(
                    clipped_start,
                    clipped_end,
                    course_bottom,
                    course_top,
                    opening,
                )
            ):
                base.create_box(
                    f"{name}Block_{course:02d}_{block_index:02d}",
                    (
                        0.58 + randomizer.uniform(-0.025, 0.025),
                        visible_length - 0.028,
                        course_height - randomizer.uniform(0.028, 0.055),
                    ),
                    (
                        0.02 + randomizer.uniform(-0.01, 0.012),
                        (clipped_start + clipped_end) / 2,
                        course_bottom
                        + course_height / 2
                        + randomizer.uniform(-0.01, 0.01),
                    ),
                    base.MATERIALS[
                        "stone_worn"
                        if (course + block_index) % 7 == 0
                        else "stone"
                    ],
                    root,
                    bevel=0.025,
                    rotation=(
                        randomizer.uniform(-0.006, 0.006),
                        randomizer.uniform(-0.006, 0.006),
                        randomizer.uniform(-0.007, 0.007),
                    ),
                )

            y_cursor += block_length
            block_index += 1

    base.create_box(
        f"{name}UpperCourse",
        (0.7, bay_length + 0.04, 0.2),
        (0.0, 0.0, wall_height - 0.1),
        base.MATERIALS["stone_worn"],
        root,
        bevel=0.028,
    )

    if opening is not None:
        y_min, y_max, z_min, z_max = opening
        opening_width = y_max - y_min
        opening_height = z_max - z_min
        y_center = (y_min + y_max) / 2
        z_center = (z_min + z_max) / 2

        base.create_box(
            f"{name}NicheBack",
            (0.08, opening_width - 0.12, opening_height - 0.12),
            (-0.24, y_center, z_center),
            base.MATERIALS["stone_dark"],
            root,
            bevel=0.01,
        )

        for y_position in (y_min - 0.09, y_max + 0.09):
            base.create_box(
                f"{name}NicheJamb_{y_position}",
                (0.72, 0.2, opening_height + 0.34),
                (0.04, y_position, z_center),
                base.MATERIALS["stone_worn"],
                root,
                bevel=0.03,
            )

        for z_position in (z_min - 0.09, z_max + 0.09):
            base.create_box(
                f"{name}NicheCourse_{z_position}",
                (0.72, opening_width + 0.4, 0.2),
                (0.04, y_center, z_position),
                base.MATERIALS["stone_worn"],
                root,
                bevel=0.03,
            )

    return base.finalize_asset(root, catalog_location)


def create_gallery_plinth(catalog_location):
    root = base.create_root("GalleryPlinth", "architecture")

    base.create_box(
        "GalleryPlinthLower",
        (0.76, 2.5, 0.17),
        (0.06, 0.0, 0.085),
        base.MATERIALS["stone"],
        root,
        bevel=0.024,
    )
    base.create_box(
        "GalleryPlinthMiddle",
        (0.64, 2.5, 0.19),
        (0.03, 0.0, 0.26),
        base.MATERIALS["stone_worn"],
        root,
        bevel=0.026,
    )
    base.create_box(
        "GalleryPlinthUpper",
        (0.54, 2.5, 0.17),
        (0.0, 0.0, 0.44),
        base.MATERIALS["stone"],
        root,
        bevel=0.022,
    )
    return base.finalize_asset(root, catalog_location)


def create_integrated_archive_cabinet(catalog_location):
    root = base.create_root("IntegratedArchiveCabinet", "furniture_and_storage")
    width = 1.48
    depth = 0.46
    height = 1.9

    base.create_box(
        "ArchiveCabinetCase",
        (width, depth, height),
        (0.0, 0.0, height / 2),
        base.MATERIALS["wood_dark"],
        root,
        bevel=0.028,
    )
    base.create_box(
        "ArchiveCabinetCrown",
        (width + 0.14, depth + 0.08, 0.12),
        (0.0, -0.01, height + 0.06),
        base.MATERIALS["wood"],
        root,
        bevel=0.024,
    )
    base.create_box(
        "ArchiveCabinetPlinth",
        (width + 0.1, depth + 0.06, 0.14),
        (0.0, -0.01, 0.07),
        base.MATERIALS["wood"],
        root,
        bevel=0.022,
    )

    drawer_width = 0.63
    drawer_height = 0.32

    for row in range(5):
        for column in range(2):
            x_position = (
                -drawer_width / 2 - 0.035
                if column == 0
                else drawer_width / 2 + 0.035
            )
            z_position = 0.27 + row * 0.32
            base.create_box(
                f"ArchiveDrawer_{row:02d}_{column:02d}",
                (drawer_width, 0.045, drawer_height - 0.035),
                (x_position, -depth / 2 - 0.025, z_position),
                base.MATERIALS[
                    "wood" if (row + column) % 3 else "wood_dark"
                ],
                root,
                bevel=0.012,
            )
            base.create_box(
                f"ArchiveDrawerLabel_{row:02d}_{column:02d}",
                (0.24, 0.015, 0.085),
                (
                    x_position,
                    -depth / 2 - 0.055,
                    z_position + 0.045,
                ),
                base.MATERIALS["paper"],
                root,
                bevel=0.004,
            )
            base.create_torus(
                f"ArchiveDrawerPull_{row:02d}_{column:02d}",
                0.045,
                0.007,
                (
                    x_position,
                    -depth / 2 - 0.075,
                    z_position - 0.055,
                ),
                base.MATERIALS["brass"],
                root,
                rotation=(pi / 2, 0.0, 0.0),
                major_segments=12,
                minor_segments=5,
            )

    return base.finalize_asset(root, catalog_location)


def create_gallery_study_desk(catalog_location):
    root = base.create_root("GalleryStudyDesk", "furniture_and_storage")

    base.create_box(
        "GalleryDeskTop",
        (1.58, 0.68, 0.1),
        (0.0, 0.0, 0.82),
        base.MATERIALS["wood"],
        root,
        bevel=0.035,
    )
    base.create_box(
        "GalleryDeskInset",
        (1.22, 0.48, 0.018),
        (0.0, -0.015, 0.878),
        base.MATERIALS["leather_umber"],
        root,
        bevel=0.008,
    )

    for x_position in (-0.65, 0.65):
        for y_position in (-0.22, 0.22):
            base.create_box(
                f"GalleryDeskLeg_{x_position}_{y_position}",
                (0.1, 0.1, 0.78),
                (x_position, y_position, 0.39),
                base.MATERIALS["wood_dark"],
                root,
                bevel=0.018,
                rotation=(
                    radians(-1.5 if x_position < 0 else 1.5),
                    radians(1.5 if y_position < 0 else -1.5),
                    0.0,
                ),
            )

    base.create_box(
        "GalleryDeskApron",
        (1.36, 0.08, 0.19),
        (0.0, -0.3, 0.7),
        base.MATERIALS["wood_dark"],
        root,
        bevel=0.016,
    )
    base.create_box(
        "GalleryDeskDrawer",
        (0.58, 0.055, 0.17),
        (0.0, -0.355, 0.7),
        base.MATERIALS["wood"],
        root,
        bevel=0.012,
    )
    base.create_torus(
        "GalleryDeskDrawerPull",
        0.045,
        0.007,
        (0.0, -0.39, 0.69),
        base.MATERIALS["brass"],
        root,
        rotation=(pi / 2, 0.0, 0.0),
        major_segments=12,
        minor_segments=5,
    )

    return base.finalize_asset(root, catalog_location)


def create_framed_study(name, catalog_location, seed):
    root = base.create_root(name, "documents_and_studies")
    randomizer = Random(seed)
    width = 1.02
    height = 1.42
    frame_width = 0.09

    base.create_box(
        f"{name}Backing",
        (width, 0.06, height),
        (0.0, 0.0, height / 2),
        base.MATERIALS["wood_dark"],
        root,
        bevel=0.016,
    )
    base.create_box(
        f"{name}Paper",
        (width - 0.18, 0.018, height - 0.18),
        (0.0, -0.045, height / 2),
        base.MATERIALS[
            "paper_light" if seed % 2 else "paper"
        ],
        root,
        bevel=0.005,
    )

    for x_position in (-width / 2 + frame_width / 2, width / 2 - frame_width / 2):
        base.create_box(
            f"{name}FrameSide_{x_position}",
            (frame_width, 0.1, height),
            (x_position, -0.04, height / 2),
            base.MATERIALS["wood"],
            root,
            bevel=0.02,
        )

    for z_position in (frame_width / 2, height - frame_width / 2):
        base.create_box(
            f"{name}FrameCourse_{z_position}",
            (width, 0.1, frame_width),
            (0.0, -0.04, z_position),
            base.MATERIALS["wood"],
            root,
            bevel=0.02,
        )

    for line_index in range(10):
        line_width = randomizer.uniform(0.26, 0.68)
        x_offset = randomizer.uniform(-0.12, 0.12)
        z_position = 0.25 + line_index * 0.09
        base.create_box(
            f"{name}NeutralLine_{line_index:02d}",
            (line_width, 0.009, 0.012),
            (x_offset, -0.061, z_position),
            base.MATERIALS["wood_dark"],
            root,
            bevel=0.002,
            rotation=(0.0, 0.0, randomizer.uniform(-0.03, 0.03)),
        )

    for sketch_index in range(4):
        angle = sketch_index * pi / 2 + randomizer.uniform(-0.14, 0.14)
        base.create_curve_tube(
            f"{name}Sketch_{sketch_index:02d}",
            (
                (
                    cos(angle) * 0.08,
                    -0.067,
                    1.04 + sin(angle) * 0.08,
                ),
                (
                    cos(angle) * 0.23,
                    -0.067,
                    1.04 + sin(angle) * 0.23,
                ),
            ),
            0.006,
            base.MATERIALS["wood_dark"],
            root,
            resolution=1,
        )

    return base.finalize_asset(root, catalog_location)


def create_rolled_map_bundle(catalog_location):
    root = base.create_root("RolledMapBundle", "books_and_paper")

    for index, (y_position, radius) in enumerate(
        ((-0.18, 0.075), (0.0, 0.09), (0.2, 0.065))
    ):
        base.create_cylinder(
            f"RolledMap_{index:02d}",
            radius,
            0.72 - index * 0.06,
            (0.0, y_position, radius),
            base.MATERIALS[
                "paper_light" if index != 1 else "paper"
            ],
            root,
            vertices=18,
            bevel=0.006,
            rotation=(0.0, pi / 2, 0.0),
        )
        base.create_torus(
            f"RolledMapTie_{index:02d}",
            radius + 0.005,
            0.008,
            (0.05 - index * 0.04, y_position, radius),
            base.MATERIALS["leather_umber"],
            root,
            rotation=(0.0, pi / 2, 0.0),
            major_segments=14,
            minor_segments=5,
        )

    return base.finalize_asset(root, catalog_location)


def create_correspondence_stack(catalog_location):
    root = base.create_root("CorrespondenceStack", "books_and_paper")
    placements = (
        ((0.0, 0.0, 0.014), -0.05),
        ((0.035, -0.05, 0.026), 0.04),
        ((-0.045, 0.035, 0.038), -0.015),
        ((0.07, 0.02, 0.05), 0.07),
    )

    for index, (location, rotation) in enumerate(placements):
        base.create_curved_sheet(
            f"CorrespondenceSheet_{index:02d}",
            0.42 - index * 0.012,
            0.58 - index * 0.018,
            location,
            base.MATERIALS[
                "paper_light" if index % 2 == 0 else "paper"
            ],
            root,
            curl=0.024 + index * 0.006,
            wave=(1 if index % 2 else -1) * 0.005,
            rotation=(0.0, 0.0, rotation),
        )

    base.create_box(
        "CorrespondenceRibbon",
        (0.055, 0.63, 0.018),
        (0.07, 0.0, 0.065),
        base.MATERIALS["leather_umber"],
        root,
        bevel=0.005,
        rotation=(0.0, 0.0, 0.03),
    )
    return base.finalize_asset(root, catalog_location)


def create_gallery_lantern(catalog_location):
    root = base.create_root("GalleryWallLantern", "lighting_props")

    base.create_box(
        "GalleryLanternBackplate",
        (0.34, 0.08, 0.56),
        (0.0, 0.03, 0.32),
        base.MATERIALS["iron"],
        root,
        bevel=0.03,
    )
    base.create_curve_tube(
        "GalleryLanternBracket",
        (
            (0.0, -0.02, 0.42),
            (0.0, -0.32, 0.55),
            (0.0, -0.46, 0.42),
        ),
        0.025,
        base.MATERIALS["iron"],
        root,
    )
    base.create_box(
        "GalleryLanternBody",
        (0.34, 0.34, 0.5),
        (0.0, -0.5, 0.34),
        base.MATERIALS["glass"],
        root,
        bevel=0.025,
    )

    for x_position in (-0.19, 0.19):
        for y_position in (-0.34, -0.66):
            base.create_box(
                f"GalleryLanternRail_{x_position}_{y_position}",
                (0.025, 0.025, 0.58),
                (x_position, y_position, 0.36),
                base.MATERIALS["iron"],
                root,
                bevel=0.006,
            )

    for z_position in (0.06, 0.64):
        base.create_box(
            f"GalleryLanternBand_{z_position}",
            (0.43, 0.43, 0.04),
            (0.0, -0.5, z_position),
            base.MATERIALS["brass"],
            root,
            bevel=0.008,
        )

    base.create_cone(
        "GalleryLanternFlame",
        0.055,
        0.0,
        0.18,
        (0.0, -0.5, 0.34),
        base.MATERIALS["flame"],
        root,
        vertices=12,
        bevel=0.002,
    )
    return base.finalize_asset(root, catalog_location)


def create_threshold_plaque(catalog_location):
    root = base.create_root(
        "ThresholdArchivePlaque",
        "future_content_support",
    )
    root["interaction_role"] = "future_project_preview"
    root["content_status"] = "neutral_placeholder"

    base.create_box(
        "ThresholdPlaqueBacking",
        (1.52, 0.09, 0.34),
        (0.0, 0.0, 0.17),
        base.MATERIALS["wood_dark"],
        root,
        bevel=0.022,
    )
    base.create_box(
        "ThresholdPlaqueInset",
        (1.2, 0.018, 0.16),
        (0.0, -0.055, 0.17),
        base.MATERIALS["paper"],
        root,
        bevel=0.006,
    )

    for x_position in (-0.64, 0.64):
        base.create_box(
            f"ThresholdPlaqueCorner_{x_position}",
            (0.07, 0.025, 0.25),
            (x_position, -0.068, 0.17),
            base.MATERIALS["brass"],
            root,
            bevel=0.006,
        )

    for line_index, width in enumerate((0.72, 0.5)):
        base.create_box(
            f"ThresholdPlaqueNeutralLine_{line_index:02d}",
            (width, 0.008, 0.014),
            (0.0, -0.071, 0.2 - line_index * 0.07),
            base.MATERIALS["wood_dark"],
            root,
            bevel=0.002,
        )

    return base.finalize_asset(root, catalog_location)


def create_gallery_growth(catalog_location):
    root = base.create_root("GalleryLocalizedGrowth", "textile_and_dressing")
    randomizer = Random(613)

    for stem_index in range(4):
        angle = -0.35 + stem_index * 0.35
        base.create_curve_tube(
            f"GalleryGrowthStem_{stem_index:02d}",
            (
                (0.0, 0.0, 0.02),
                (
                    cos(angle) * 0.15,
                    sin(angle) * 0.12,
                    0.13 + stem_index * 0.02,
                ),
                (
                    cos(angle) * 0.3,
                    sin(angle) * 0.24,
                    0.24 + stem_index * 0.025,
                ),
            ),
            0.008,
            base.MATERIALS["foliage_dry"],
            root,
            resolution=1,
        )

    for leaf_index in range(9):
        angle = randomizer.uniform(-0.9, 0.9)
        radius = randomizer.uniform(0.08, 0.32)
        base.create_ground_leaf(
            root,
            f"GalleryGrowthLeaf_{leaf_index:02d}",
            (
                cos(angle) * radius,
                sin(angle) * radius,
                randomizer.uniform(0.025, 0.055),
            ),
            randomizer.uniform(0.1, 0.17),
            randomizer.uniform(0.035, 0.06),
            angle,
            base.MATERIALS[
                "foliage_dry" if leaf_index % 4 == 0 else "foliage"
            ],
        )

    return base.finalize_asset(root, catalog_location)


def create_book_assets():
    variants = (
        (
            "ProvenanceBookA",
            0.085,
            0.245,
            0.42,
            "leather_umber",
            2,
        ),
        (
            "ProvenanceBookB",
            0.13,
            0.31,
            0.49,
            "leather_green",
            0,
        ),
        (
            "ProvenanceBookC",
            0.1,
            0.27,
            0.36,
            "leather",
            1,
        ),
        (
            "ProvenanceBookD",
            0.16,
            0.34,
            0.56,
            "leather_umber",
            0,
        ),
    )

    for index, (
        name,
        width,
        depth,
        height,
        material_name,
        band_count,
    ) in enumerate(variants):
        base.create_book_asset(
            name,
            width,
            depth,
            height,
            base.MATERIALS[material_name],
            (24.0 + index * 0.6, -8.0, 0.0),
            band_count=band_count,
        )

    base.create_book_stack(
        "ProvenanceBookStack",
        (24.0, -5.0, 0.0),
        (
            "ProvenanceBookD",
            "ProvenanceBookA",
            "ProvenanceBookC",
            "ProvenanceBookB",
        ),
    )


def create_gallery_assets():
    for index, seed in enumerate((431, 557, 683)):
        create_gallery_floor_bay(
            f"GalleryFloorBay{index + 1}",
            seed,
            (18.0 + index * 6.0, 0.0, 0.0),
        )
        create_gallery_vault_bay(
            f"GalleryVaultBay{index + 1}",
            (18.0 + index * 6.0, 4.0, 0.0),
        )

    create_gallery_wall_bay(
        "GalleryWallStandardA",
        719,
        (18.0, 8.0, 0.0),
    )
    create_gallery_wall_bay(
        "GalleryWallStandardB",
        887,
        (24.0, 8.0, 0.0),
    )
    create_gallery_wall_bay(
        "GalleryWallAboutNiche",
        941,
        (30.0, 8.0, 0.0),
        opening=(-0.72, 0.72, 0.72, 2.95),
    )
    create_gallery_wall_bay(
        "GalleryWallSocialNiche",
        1031,
        (36.0, 8.0, 0.0),
        opening=(-0.56, 0.56, 0.82, 1.82),
    )
    create_gallery_plinth((18.0, 12.0, 0.0))

    base.create_arch_asset(
        "GalleryBayArch",
        (22.0, 12.0, 0.0),
        total_width=5.4,
        total_height=4.85,
        opening_width=3.35,
        opening_height=4.05,
        depth=0.56,
        include_wall=False,
    )
    base.create_arch_asset(
        "GalleryProjectThreshold",
        (28.0, 12.0, 0.0),
        total_width=5.7,
        total_height=4.85,
        opening_width=3.25,
        opening_height=4.05,
        depth=0.92,
        include_wall=True,
    )

    create_book_assets()
    base.create_open_book((24.0, -2.0, 0.0))
    base.create_loose_papers((26.0, -2.0, 0.0))
    base.create_notebook((28.0, -2.0, 0.0))
    base.create_reading_stool((30.0, -2.0, 0.0))
    base.create_candle_asset((31.0, -2.0, 0.0))
    base.create_candle_cluster((32.0, -2.0, 0.0))
    base.create_lectern((34.0, -2.0, 0.0))

    create_integrated_archive_cabinet((38.0, -2.0, 0.0))
    create_gallery_study_desk((40.0, -2.0, 0.0))
    create_framed_study("FramedInfluenceStudy", (38.0, 2.0, 0.0), 151)
    create_framed_study("FramedAboutPlaceholder", (40.0, 2.0, 0.0), 271)
    create_framed_study("FramedRouteStudy", (42.0, 2.0, 0.0), 389)
    create_rolled_map_bundle((38.0, 6.0, 0.0))
    create_correspondence_stack((40.0, 6.0, 0.0))
    create_gallery_lantern((42.0, 6.0, 0.0))
    create_gallery_growth((44.0, 6.0, 0.0))
    create_threshold_plaque((46.0, 6.0, 0.0))


def create_story_cluster(
    assembly,
    name,
    location,
    side,
    owner,
    action,
    state,
):
    cluster = base.create_story_cluster(
        assembly,
        name,
        location,
        owner,
        action,
        state,
    )
    cluster["route_side"] = side
    PROP_GROUPS.append(cluster)
    return cluster


def create_provenance_assembly():
    assembly = base.create_root(
        "ProvenanceGalleryAssembly",
        "scene_assembly",
    )
    assembly["scope"] = (
        "post-entrance transition, provenance gallery, "
        "first project threshold"
    )
    assembly["forward_axis"] = (
        "+Y in Blender, -Z in React Three Fiber before placement rotation"
    )
    assembly["entrance_asset_policy"] = "separate and unchanged"
    bay_centers = (1.25, 3.75, 6.25)

    for bay_index, y_position in enumerate(bay_centers):
        base.instance_asset(
            f"GalleryFloorBay{bay_index + 1}",
            assembly,
            f"ProvenanceFloor_{bay_index:02d}",
            (0.0, y_position, 0.0),
        )
        base.instance_asset(
            f"GalleryVaultBay{bay_index + 1}",
            assembly,
            f"ProvenanceVault_{bay_index:02d}",
            (0.0, y_position, 0.0),
        )

        left_wall_asset = (
            "GalleryWallAboutNiche"
            if bay_index == 2
            else "GalleryWallStandardA"
            if bay_index == 0
            else "GalleryWallStandardB"
        )
        right_wall_asset = (
            "GalleryWallSocialNiche"
            if bay_index == 2
            else "GalleryWallStandardB"
            if bay_index == 0
            else "GalleryWallStandardA"
        )

        base.instance_asset(
            left_wall_asset,
            assembly,
            f"ProvenanceLeftWall_{bay_index:02d}",
            (-2.5, y_position, 0.0),
        )
        base.instance_asset(
            right_wall_asset,
            assembly,
            f"ProvenanceRightWall_{bay_index:02d}",
            (2.5, y_position, 0.0),
            rotation=(0.0, 0.0, pi),
        )
        base.instance_asset(
            "GalleryPlinth",
            assembly,
            f"ProvenanceLeftPlinth_{bay_index:02d}",
            (-2.45, y_position, 0.0),
        )
        base.instance_asset(
            "GalleryPlinth",
            assembly,
            f"ProvenanceRightPlinth_{bay_index:02d}",
            (2.45, y_position, 0.0),
            rotation=(0.0, 0.0, pi),
        )

    for arch_index, y_position in enumerate((2.5, 5.0)):
        base.instance_asset(
            "GalleryBayArch",
            assembly,
            f"ProvenanceBayArch_{arch_index:02d}",
            (0.0, y_position, 0.0),
        )

    base.instance_asset(
        "GalleryProjectThreshold",
        assembly,
        "ProvenanceProjectThreshold",
        (0.0, 7.45, 0.0),
    )
    threshold_plaque = base.instance_asset(
        "ThresholdArchivePlaque",
        assembly,
        "FutureProjectPreviewSurface",
        (0.0, 7.0, 4.28),
    )
    threshold_plaque["interaction_role"] = "future_project_preview"
    threshold_plaque["content_status"] = "neutral_placeholder"

    archive_cluster = create_story_cluster(
        assembly,
        "ArchiveIndexingCluster",
        (-1.75, 1.45, 0.0),
        "left",
        "archive custodian",
        "sorted unlabelled reference material by influence",
        "one drawer remains open beside a waiting map bundle",
    )
    base.instance_asset(
        "IntegratedArchiveCabinet",
        archive_cluster,
        "GalleryArchiveCabinet",
        (0.0, 0.0, 0.0),
        rotation=(0.0, 0.0, pi / 2),
        scale=(0.9, 0.9, 0.9),
    )
    base.instance_asset(
        "RolledMapBundle",
        archive_cluster,
        "GalleryArchiveMaps",
        (0.25, 0.72, 0.03),
        rotation=(0.0, 0.0, 0.08),
        scale=(0.88, 0.88, 0.88),
    )
    base.instance_asset(
        "ProvenanceBookStack",
        archive_cluster,
        "GalleryArchiveBookStack",
        (0.26, -0.72, 0.03),
        rotation=(0.0, 0.0, -0.08),
        scale=(0.76, 0.76, 0.76),
    )

    about_cluster = create_story_cluster(
        assembly,
        "AboutArchiveCluster",
        (-2.0, 6.15, 0.0),
        "left",
        "future content curator",
        "reserved an architectural surface for approved personal context",
        "neutral study remains in place until content is approved",
    )
    about_cluster["interaction_role"] = "future_about"
    about_cluster["content_status"] = "neutral_placeholder"
    about_surface = base.instance_asset(
        "FramedAboutPlaceholder",
        about_cluster,
        "AboutArchiveSurface",
        (0.06, 0.0, 0.91),
        rotation=(0.0, 0.0, pi / 2),
        scale=(0.84, 0.84, 0.84),
    )
    about_surface["interaction_role"] = "future_about"
    about_surface["content_status"] = "neutral_placeholder"
    base.instance_asset(
        "Notebook",
        about_cluster,
        "AboutArchiveNotebook",
        (0.63, -0.56, 0.55),
        rotation=(0.0, 0.0, 0.12),
        scale=(0.78, 0.78, 0.78),
    )

    research_cluster = create_story_cluster(
        assembly,
        "InterruptedResearchCluster",
        (1.55, 5.65, 0.0),
        "right",
        "researcher",
        "compared a route study with correspondence and annotations",
        "stool is drawn back and the comparison remains unfinished",
    )
    base.instance_asset(
        "GalleryStudyDesk",
        research_cluster,
        "GalleryInterruptedDesk",
        (0.0, 0.0, 0.0),
        rotation=(0.0, 0.0, pi / 2),
        scale=(0.92, 0.92, 0.92),
    )
    base.instance_asset(
        "OpenBook",
        research_cluster,
        "GalleryAnnotatedOpenBook",
        (-0.22, -0.22, 0.86),
        rotation=(0.0, 0.0, -0.1),
        scale=(0.72, 0.72, 0.72),
    )
    base.instance_asset(
        "CorrespondenceStack",
        research_cluster,
        "GalleryCorrespondenceStack",
        (0.18, 0.24, 0.88),
        rotation=(0.0, 0.0, 0.16),
        scale=(0.72, 0.72, 0.72),
    )
    base.instance_asset(
        "LoosePapers",
        research_cluster,
        "GalleryDeskLooseStudies",
        (-0.1, 0.72, 0.04),
        rotation=(0.0, 0.0, -0.08),
        scale=(0.66, 0.66, 0.66),
    )
    base.instance_asset(
        "ReadingStool",
        research_cluster,
        "GalleryPulledStool",
        (-0.12, -0.78, 0.0),
        rotation=(0.0, 0.0, -0.1),
        scale=(0.8, 0.8, 0.8),
    )
    base.instance_asset(
        "CandleCluster",
        research_cluster,
        "GalleryDeskCandles",
        (0.02, 0.35, 0.87),
        scale=(0.58, 0.58, 0.58),
    )

    study_cluster = create_story_cluster(
        assembly,
        "InfluenceStudiesCluster",
        (-1.85, 4.35, 0.0),
        "left",
        "unknown reader",
        "grouped neutral visual studies beside the project threshold",
        "frames remain content-neutral pending approved source material",
    )
    base.instance_asset(
        "FramedInfluenceStudy",
        study_cluster,
        "GalleryInfluenceStudy",
        (0.0, -0.34, 0.78),
        rotation=(0.0, 0.0, pi / 2),
        scale=(0.78, 0.78, 0.78),
    )
    base.instance_asset(
        "FramedRouteStudy",
        study_cluster,
        "GalleryRouteStudy",
        (0.0, 0.56, 0.9),
        rotation=(0.0, 0.0, pi / 2),
        scale=(0.68, 0.68, 0.68),
    )
    base.instance_asset(
        "Lectern",
        study_cluster,
        "GalleryThresholdLectern",
        (0.52, 0.4, 0.0),
        rotation=(0.0, 0.0, pi / 2),
        scale=(0.78, 0.78, 0.78),
    )

    social_cluster = create_story_cluster(
        assembly,
        "SocialArchiveCluster",
        (2.05, 6.25, 0.0),
        "right",
        "future content curator",
        "reserved a discreet set of archive labels for approved links",
        "three blank labels remain integrated into the wall niche",
    )
    social_cluster["interaction_role"] = "future_social_links"
    social_cluster["content_status"] = "neutral_placeholder"

    for label_index, y_offset in enumerate((-0.28, 0.0, 0.28)):
        label = base.create_box(
            f"SocialArchiveLabel_{label_index:02d}",
            (0.055, 0.18, 0.12),
            (0.0, y_offset, 1.12),
            base.MATERIALS["paper"],
            social_cluster,
            bevel=0.008,
        )
        label["interaction_role"] = "future_social_links"
        label["content_status"] = "neutral_placeholder"
        base.create_box(
            f"SocialArchiveLabelFrame_{label_index:02d}",
            (0.075, 0.22, 0.16),
            (-0.015, y_offset, 1.12),
            base.MATERIALS["brass"],
            social_cluster,
            bevel=0.01,
        )

    light_cluster = create_story_cluster(
        assembly,
        "GalleryLightCluster",
        (2.08, 5.45, 1.55),
        "right",
        "building custodian",
        "left a compact study lantern burning beside the active desk",
        "the local source creates a contained pool of warm light",
    )
    base.instance_asset(
        "GalleryWallLantern",
        light_cluster,
        "GalleryActiveWallLantern",
        (0.0, 0.0, 0.0),
        rotation=(0.0, 0.0, -pi / 2),
        scale=(0.82, 0.82, 0.82),
    )

    growth_cluster = create_story_cluster(
        assembly,
        "GalleryMoistureGrowthCluster",
        (-2.05, 2.35, 0.02),
        "left",
        "building fabric",
        "supports limited growth at one repaired damp joint",
        "growth remains sparse and outside the walking line",
    )
    base.instance_asset(
        "GalleryLocalizedGrowth",
        growth_cluster,
        "GalleryLocalizedGrowthInstance",
        (0.0, 0.0, 0.0),
        rotation=(0.0, 0.0, 0.18),
        scale=(0.72, 0.72, 0.72),
    )

    return assembly


def look_at(object_, target):
    direction = Vector(target) - object_.location
    object_.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def create_preview_scene():
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x = 960
    scene.render.resolution_y = 640
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = str(PREVIEW_PATH)
    scene.world.color = (0.006, 0.008, 0.011)

    try:
        scene.view_settings.look = "AgX - Medium High Contrast"
    except TypeError:
        pass

    camera_data = bpy.data.cameras.new("ProvenancePreviewCamera")
    camera = bpy.data.objects.new("ProvenancePreviewCamera", camera_data)
    scene.collection.objects.link(camera)
    camera.location = (0.0, -0.72, 1.68)
    camera_data.lens = 32
    look_at(camera, (0.0, 6.2, 1.9))
    scene.camera = camera

    warm_data = bpy.data.lights.new("ProvenancePreviewWarm", "AREA")
    warm_data.energy = 390
    warm_data.color = (1.0, 0.42, 0.15)
    warm_data.shape = "DISK"
    warm_data.size = 2.5
    warm = bpy.data.objects.new("ProvenancePreviewWarm", warm_data)
    scene.collection.objects.link(warm)
    warm.location = (1.8, 4.1, 2.8)
    look_at(warm, (0.0, 4.0, 1.2))

    candle_data = bpy.data.lights.new("ProvenancePreviewCandle", "POINT")
    candle_data.energy = 110
    candle_data.color = (1.0, 0.32, 0.09)
    candle_data.shadow_soft_size = 0.8
    candle = bpy.data.objects.new("ProvenancePreviewCandle", candle_data)
    scene.collection.objects.link(candle)
    candle.location = (1.55, 4.1, 1.35)

    cool_data = bpy.data.lights.new("ProvenancePreviewCool", "AREA")
    cool_data.energy = 430
    cool_data.color = (0.42, 0.54, 0.62)
    cool_data.shape = "DISK"
    cool_data.size = 2.2
    cool = bpy.data.objects.new("ProvenancePreviewCool", cool_data)
    scene.collection.objects.link(cool)
    cool.location = (0.0, 8.1, 3.0)
    look_at(cool, (0.0, 6.6, 1.5))

    bpy.ops.render.render(write_still=True)


def combined_bounds(root):
    points = []
    bpy.context.view_layer.update()

    for object_ in root.children_recursive:
        if object_.type != "MESH":
            continue

        points.extend(
            object_.matrix_world @ Vector(corner)
            for corner in object_.bound_box
        )

    if not points:
        return None

    return (
        min(point.x for point in points),
        max(point.x for point in points),
        min(point.y for point in points),
        max(point.y for point in points),
        min(point.z for point in points),
        max(point.z for point in points),
    )


def validate_prop_clearance():
    violations = []
    bounds_by_cluster = {}

    for cluster in PROP_GROUPS:
        bounds = combined_bounds(cluster)
        bounds_by_cluster[cluster.name] = bounds

        if bounds is None:
            continue

        minimum_x, maximum_x, minimum_y, maximum_y, minimum_z, maximum_z = (
            bounds
        )
        overlaps_route_height = minimum_z < 2.25 and maximum_z > 0.0
        overlaps_gallery = minimum_y < GALLERY_LENGTH and maximum_y > 0.0
        overlaps_route_width = (
            minimum_x < ROUTE_HALF_WIDTH
            and maximum_x > -ROUTE_HALF_WIDTH
        )

        if overlaps_route_height and overlaps_gallery and overlaps_route_width:
            violations.append(cluster.name)

    return violations, bounds_by_cluster


def strip_export_textures(assembly):
    materials = {
        material
        for object_ in assembly.children_recursive
        if object_.type == "MESH"
        for material in object_.data.materials
        if material is not None
    }

    for material in materials:
        if not material.use_nodes:
            continue

        nodes = material.node_tree.nodes
        links = material.node_tree.links
        nodes.clear()
        output = nodes.new("ShaderNodeOutputMaterial")
        shader = nodes.new("ShaderNodeBsdfPrincipled")
        base.shader_input(shader, "Base Color").default_value = (
            material.diffuse_color
        )
        base.shader_input(shader, "Roughness").default_value = (
            material.roughness
        )
        base.shader_input(shader, "Metallic").default_value = (
            material.metallic
        )
        base.shader_input(shader, "Alpha").default_value = (
            material.diffuse_color[3]
        )
        links.new(shader.outputs["BSDF"], output.inputs["Surface"])


def assembly_triangle_count(assembly):
    return sum(
        len(polygon.vertices) - 2
        for object_ in assembly.children_recursive
        if object_.type == "MESH"
        for polygon in object_.data.polygons
    )


def main():
    BLEND_PATH.parent.mkdir(parents=True, exist_ok=True)
    GLB_PATH.parent.mkdir(parents=True, exist_ok=True)

    base.clear_scene()
    base.ASSET_MESHES.clear()
    base.MATERIALS.clear()
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0
    scene["pipeline"] = "blender_to_glb_to_react_three_fiber"
    scene["production_scope"] = (
        "post-entrance transition, provenance gallery, "
        "first project threshold"
    )
    scene["validated_entrance_modified"] = False

    base.create_material_library()
    create_gallery_assets()
    assembly = create_provenance_assembly()
    create_preview_scene()
    violations, bounds_by_cluster = validate_prop_clearance()

    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.file.pack_all()
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))

    strip_export_textures(assembly)
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
    )

    print(f"PROVENANCE_BLEND={BLEND_PATH}")
    print(f"PROVENANCE_GLB={GLB_PATH}")
    print(f"PROVENANCE_PREVIEW={PREVIEW_PATH}")
    print(f"PROVENANCE_GLB_BYTES={GLB_PATH.stat().st_size}")
    print(
        "PROVENANCE_ASSEMBLY_TRIANGLES="
        f"{assembly_triangle_count(assembly)}"
    )
    print(
        "PROVENANCE_ASSEMBLY_MESHES="
        f"{sum(1 for child in assembly.children_recursive if child.type == 'MESH')}"
    )
    print(f"PROVENANCE_PROP_BOUNDS={bounds_by_cluster}")
    print(f"PROVENANCE_PROP_CLEARANCE_VIOLATIONS={violations}")

    if violations:
        raise RuntimeError(
            "Provenance props enter the protected route: "
            + ", ".join(violations)
        )


if __name__ == "__main__":
    main()
