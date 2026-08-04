from math import cos, pi, radians, sin
import os
from pathlib import Path
from random import Random
import sys

import bpy
from mathutils import Vector

sys.dont_write_bytecode = True


SCRIPT_DIR = Path(__file__).resolve().parent
ROOT = SCRIPT_DIR.parents[1]
BLEND_PATH = ROOT / "assets" / "blender" / "final_route_asset_library.blend"
GLB_PATH = ROOT / "public" / "models" / "final-route-asset-library.glb"
PREVIEW_PATH = Path("/tmp/final-route-asset-library-preview.png")

if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

import create_entrance_asset_library as base


PROJECT_WIDTH = 6.0
PROJECT_HEIGHT = 6.15
NARROW_WIDTH = 4.4
NARROW_HEIGHT = 5.15
CONTACT_HEIGHT = 5.45
ROUTE_HALF_WIDTH = 0.92
PROP_GROUPS = []


def create_floor_bay(name, width, length, seed, catalog_location):
    root = base.create_root(name, "architecture")
    randomizer = Random(seed)
    columns = max(3, round(width / 1.3))
    rows = max(2, round(length / 0.82))
    slab_width = width / columns
    slab_length = length / rows

    for row in range(rows):
        for column in range(columns):
            x_position = (
                -width / 2
                + slab_width * (column + 0.5)
                + (0.03 if row % 2 else -0.015)
            )
            y_position = -length / 2 + slab_length * (row + 0.5)
            x_position += randomizer.uniform(-0.01, 0.01)
            y_position += randomizer.uniform(-0.01, 0.01)

            base.create_box(
                f"{name}Slab_{row:02d}_{column:02d}",
                (
                    slab_width - randomizer.uniform(0.025, 0.048),
                    slab_length - randomizer.uniform(0.025, 0.048),
                    randomizer.uniform(0.078, 0.096),
                ),
                (
                    x_position,
                    y_position,
                    randomizer.uniform(-0.004, 0.004),
                ),
                base.MATERIALS["floor"],
                root,
                bevel=0.032,
                rotation=(
                    randomizer.uniform(-0.002, 0.002),
                    randomizer.uniform(-0.002, 0.002),
                    randomizer.uniform(-0.004, 0.004),
                ),
            )

    return base.finalize_asset(root, catalog_location)


def create_wall_bay(name, length, height, seed, catalog_location):
    root = base.create_root(name, "architecture")
    randomizer = Random(seed)
    course_count = max(7, round(height / 0.42))
    course_height = height / course_count

    base.create_box(
        f"{name}MortarCore",
        (0.58, length, height),
        (-0.03, 0.0, height / 2),
        base.MATERIALS["stone_dark"],
        root,
        bevel=0.018,
    )

    for course in range(course_count):
        y_cursor = -length / 2 - (0.22 if course % 2 else 0.0)
        block_index = 0

        while y_cursor < length / 2:
            block_length = randomizer.uniform(0.4, 0.7)
            start = max(y_cursor, -length / 2)
            end = min(y_cursor + block_length, length / 2)
            visible_length = end - start

            if visible_length > 0.1:
                base.create_box(
                    f"{name}Block_{course:02d}_{block_index:02d}",
                    (
                        0.6 + randomizer.uniform(-0.018, 0.02),
                        visible_length - 0.023,
                        course_height - randomizer.uniform(0.018, 0.038),
                    ),
                    (
                        randomizer.uniform(-0.006, 0.01),
                        (start + end) / 2,
                        course_height * (course + 0.5)
                        + randomizer.uniform(-0.005, 0.005),
                    ),
                    base.MATERIALS[
                        "stone_worn"
                        if (course + block_index) % 11 == 0
                        else "stone"
                    ],
                    root,
                    bevel=0.019,
                    rotation=(
                        randomizer.uniform(-0.003, 0.003),
                        randomizer.uniform(-0.003, 0.003),
                        randomizer.uniform(-0.004, 0.004),
                    ),
                )

            y_cursor += block_length
            block_index += 1

    base.create_box(
        f"{name}LowerPlinth",
        (0.76, length + 0.06, 0.28),
        (-0.02, 0.0, 0.14),
        base.MATERIALS["stone_worn"],
        root,
        bevel=0.038,
    )
    base.create_box(
        f"{name}UpperPlinth",
        (0.68, length + 0.035, 0.15),
        (-0.01, 0.0, 0.39),
        base.MATERIALS["stone_worn"],
        root,
        bevel=0.028,
    )

    return base.finalize_asset(root, catalog_location)


def create_vault_bay(name, width, height, length, catalog_location):
    root = base.create_root(name, "architecture")
    inner_radius = width / 2
    outer_radius = inner_radius + 0.34
    spring_height = height - inner_radius
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

    for y_position in (-length * 0.46, length * 0.46):
        base.create_arch_ring_detail(
            root,
            f"{name}Rib_{'Front' if y_position < 0 else 'Back'}",
            y_position,
            spring_height,
            inner_radius - 0.04,
            inner_radius + 0.15,
            0.15,
            14,
        )

    return base.finalize_asset(root, catalog_location)


def create_project_frame_asset(catalog_location):
    root = base.create_root("ProjectFrameSupport", "project_display")

    base.create_box(
        "ProjectFrameStoneRecess",
        (0.2, 2.08, 2.72),
        (0.0, 0.0, 1.7),
        base.MATERIALS["stone_dark"],
        root,
        bevel=0.035,
    )
    for y_position in (-1.02, 1.02):
        base.create_box(
            f"ProjectFrameVertical_{y_position}",
            (0.16, 0.13, 2.55),
            (-0.13, y_position, 1.72),
            base.MATERIALS["wood_dark"],
            root,
            bevel=0.025,
        )
    for z_position in (0.47, 2.97):
        base.create_box(
            f"ProjectFrameHorizontal_{z_position}",
            (0.16, 2.18, 0.14),
            (-0.13, 0.0, z_position),
            base.MATERIALS["wood"],
            root,
            bevel=0.025,
        )
    for y_position in (-0.92, 0.92):
        for z_position in (0.59, 2.85):
            base.create_cylinder(
                f"ProjectFramePin_{y_position}_{z_position}",
                0.045,
                0.035,
                (-0.235, y_position, z_position),
                base.MATERIALS["brass"],
                root,
                vertices=12,
                bevel=0.006,
                rotation=(0.0, pi / 2, 0.0),
            )

    return base.finalize_asset(root, catalog_location)


def create_project_niche_asset(catalog_location):
    root = base.create_root("ProjectNicheSupport", "project_display")

    base.create_box(
        "ProjectNicheBacking",
        (0.2, 2.25, 2.78),
        (0.0, 0.0, 1.64),
        base.MATERIALS["stone_dark"],
        root,
        bevel=0.03,
    )
    for y_position in (-1.14, 1.14):
        for course in range(4):
            base.create_box(
                f"ProjectNicheJamb_{y_position}_{course:02d}",
                (0.24, 0.24, 0.58),
                (
                    -0.12,
                    y_position,
                    0.39 + course * 0.56,
                ),
                base.MATERIALS[
                    "stone_worn" if course in (0, 3) else "stone"
                ],
                root,
                bevel=0.032,
            )

    for index in range(7):
        angle = pi * index / 6
        base.create_box(
            f"ProjectNicheVoussoir_{index:02d}",
            (0.26, 0.32, 0.42),
            (
                -0.11,
                0.92 * cos(angle),
                2.52 + 0.45 * sin(angle),
            ),
            base.MATERIALS[
                "stone_worn" if index in (0, 3, 6) else "stone"
            ],
            root,
            bevel=0.034,
            rotation=(angle - pi / 2, 0.0, 0.0),
        )

    return base.finalize_asset(root, catalog_location)


def create_archive_display_asset(catalog_location):
    root = base.create_root("ArchiveDisplaySupport", "project_display")

    base.create_box(
        "ArchiveDisplayCabinet",
        (0.48, 2.2, 1.08),
        (0.0, 0.0, 0.54),
        base.MATERIALS["wood_dark"],
        root,
        bevel=0.035,
    )
    base.create_box(
        "ArchiveDisplayTop",
        (0.58, 2.34, 0.12),
        (-0.02, 0.0, 1.12),
        base.MATERIALS["wood"],
        root,
        bevel=0.032,
    )

    for row in range(2):
        for column in range(3):
            y_position = -0.72 + column * 0.72
            z_position = 0.3 + row * 0.43
            base.create_box(
                f"ArchiveDrawer_{row:02d}_{column:02d}",
                (0.08, 0.58, 0.3),
                (-0.27, y_position, z_position),
                base.MATERIALS["wood"],
                root,
                bevel=0.018,
            )
            base.create_box(
                f"ArchiveLabel_{row:02d}_{column:02d}",
                (0.025, 0.18, 0.095),
                (-0.325, y_position, z_position),
                base.MATERIALS["brass"],
                root,
                bevel=0.009,
            )

    return base.finalize_asset(root, catalog_location)


def create_display_surface(
    parent,
    name,
    position,
    width,
    height,
    plane_axis,
):
    if plane_axis == "x":
        dimensions = (0.035, width, height)
    else:
        dimensions = (width, 0.035, height)

    surface = base.create_box(
        name,
        dimensions,
        position,
        base.MATERIALS["display"],
        parent,
        bevel=0.004,
    )
    surface["interaction_id"] = name
    surface["content_status"] = "neutral_placeholder"
    return surface


def create_book_assets():
    variants = (
        ("FinalRouteBookA", 0.1, 0.27, 0.42, "leather", 2),
        ("FinalRouteBookB", 0.13, 0.3, 0.49, "leather_green", 0),
        ("FinalRouteBookC", 0.085, 0.24, 0.36, "leather_umber", 1),
        ("FinalRouteBookD", 0.16, 0.33, 0.54, "leather", 0),
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
            (32.0 + index * 0.7, -10.0, 0.0),
            band_count=band_count,
        )

    book_names = tuple(variant[0] for variant in variants)
    base.create_book_stack(
        "BookStackLow",
        (32.0, -7.0, 0.0),
        book_names,
    )
    base.create_bookshelf(
        "FinalRouteBookshelf",
        (35.0, -7.0, 0.0),
        width=1.9,
        height=3.05,
        shelf_count=5,
        book_names=book_names,
    )


def create_asset_library():
    base.MATERIALS["display"] = base.create_material(
        "InteractivePaperSurface",
        (0.58, 0.48, 0.34),
        0.9,
    )

    create_floor_bay(
        "ProjectFloorBay",
        PROJECT_WIDTH,
        2.5,
        2027,
        (18.0, 0.0, 0.0),
    )
    create_floor_bay(
        "NarrowFloorBay",
        NARROW_WIDTH,
        2.5,
        2111,
        (25.0, 0.0, 0.0),
    )
    create_wall_bay(
        "ProjectWallBayA",
        2.5,
        PROJECT_HEIGHT - PROJECT_WIDTH / 2 + 0.16,
        2203,
        (18.0, 7.0, 0.0),
    )
    create_wall_bay(
        "ProjectWallBayB",
        2.5,
        PROJECT_HEIGHT - PROJECT_WIDTH / 2 + 0.16,
        2297,
        (25.0, 7.0, 0.0),
    )
    create_wall_bay(
        "NarrowWallBay",
        2.5,
        NARROW_HEIGHT - NARROW_WIDTH / 2 + 0.18,
        2381,
        (32.0, 7.0, 0.0),
    )
    create_wall_bay(
        "ProjectEndWallBay",
        6.6,
        PROJECT_HEIGHT,
        2411,
        (39.0, 7.0, 0.0),
    )
    create_wall_bay(
        "DistantClosureWallBay",
        4.9,
        CONTACT_HEIGHT,
        2437,
        (46.0, 7.0, 0.0),
    )
    create_vault_bay(
        "ProjectVaultBay",
        PROJECT_WIDTH,
        PROJECT_HEIGHT,
        2.5,
        (18.0, 13.0, 0.0),
    )
    create_vault_bay(
        "NarrowVaultBay",
        NARROW_WIDTH,
        NARROW_HEIGHT,
        2.5,
        (25.0, 13.0, 0.0),
    )

    base.create_arch_asset(
        "ProjectTransitionArch",
        (32.0, 13.0, 0.0),
        total_width=6.7,
        total_height=PROJECT_HEIGHT,
        opening_width=3.8,
        opening_height=4.55,
        depth=0.76,
        include_wall=True,
    )
    base.create_arch_asset(
        "TurnThresholdArch",
        (39.0, 13.0, 0.0),
        total_width=5.2,
        total_height=NARROW_HEIGHT,
        opening_width=3.25,
        opening_height=4.15,
        depth=0.9,
        include_wall=True,
    )
    base.create_arch_asset(
        "ContactThresholdArch",
        (46.0, 13.0, 0.0),
        total_width=5.1,
        total_height=NARROW_HEIGHT,
        opening_width=3.15,
        opening_height=4.1,
        depth=0.86,
        include_wall=True,
    )
    base.create_arch_asset(
        "UnfinishedThresholdArch",
        (53.0, 13.0, 0.0),
        total_width=5.15,
        total_height=CONTACT_HEIGHT,
        opening_width=3.05,
        opening_height=4.25,
        depth=1.05,
        include_wall=True,
    )

    create_project_frame_asset((18.0, 19.0, 0.0))
    create_project_niche_asset((25.0, 19.0, 0.0))
    create_archive_display_asset((32.0, 19.0, 0.0))
    create_book_assets()
    base.create_open_book((39.0, 19.0, 0.0))
    base.create_loose_papers((42.0, 19.0, 0.0))
    base.create_notebook((45.0, 19.0, 0.0))
    base.create_reading_desk((48.0, 19.0, 0.0))
    base.create_lectern((51.0, 19.0, 0.0))
    base.create_candle_asset((54.0, 19.0, 0.0))
    base.create_candle_cluster((57.0, 19.0, 0.0))
    base.create_hanging_lantern((60.0, 19.0, 0.0))
    base.create_wall_sconce((63.0, 19.0, 0.0))
    base.create_ivy_asset(
        "FinalRouteIvy",
        (66.0, 19.0, 0.0),
        2477,
    )
    base.create_ground_growth(
        "FinalRouteGroundGrowth",
        (69.0, 19.0, 0.0),
        2551,
    )
    base.create_runner_path_asset(
        "FinalRouteRunnerPath",
        (72.0, 19.0, 0.0),
        (
            (0.0, 0.0),
            (0.0, 9.65),
            (-0.16, 10.35),
            (-0.62, 10.92),
            (-1.35, 11.4),
            (-2.25, 11.62),
            (-6.95, 11.65),
            (-7.48, 11.88),
            (-7.82, 12.35),
            (-8.0, 13.05),
            (-8.0, 19.72),
        ),
        2609,
        width=1.42,
    )


def create_story_cluster(
    assembly,
    name,
    location,
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
    PROP_GROUPS.append(cluster)
    return cluster


def instance_project_architecture(assembly):
    project_bay_centers = (1.25, 3.75, 6.25, 8.75, 11.25)

    for index, y_position in enumerate(project_bay_centers):
        base.instance_asset(
            "ProjectFloorBay",
            assembly,
            f"ProjectGalleryFloor_{index:02d}",
            (0.0, y_position, 0.0),
        )
        base.instance_asset(
            "ProjectVaultBay",
            assembly,
            f"ProjectGalleryVault_{index:02d}",
            (0.0, y_position, 0.0),
        )
        base.instance_asset(
            "ProjectWallBayA" if index % 2 == 0 else "ProjectWallBayB",
            assembly,
            f"ProjectGalleryRightWall_{index:02d}",
            (3.3, y_position, 0.0),
            rotation=(0.0, 0.0, pi),
        )

        if index < 4:
            base.instance_asset(
                "ProjectWallBayB"
                if index % 2 == 0
                else "ProjectWallBayA",
                assembly,
                f"ProjectGalleryLeftWall_{index:02d}",
                (-3.3, y_position, 0.0),
            )

    base.instance_asset(
        "ProjectTransitionArch",
        assembly,
        "ProjectGalleryEntranceArch",
        (0.0, 0.3, 0.0),
    )

    for index, y_position in enumerate((2.5, 5.0, 7.5)):
        base.instance_asset(
            "ProjectTransitionArch",
            assembly,
            f"ProjectGalleryRhythmArch_{index:02d}",
            (0.0, y_position, 0.0),
            scale=(0.97, 0.42, 0.97),
        )

    base.instance_asset(
        "TurnThresholdArch",
        assembly,
        "ProjectToSocialArch",
        (-3.18, 11.4, 0.0),
        rotation=(0.0, 0.0, pi / 2),
    )
    base.instance_asset(
        "ProjectEndWallBay",
        assembly,
        "ProjectGalleryEndMasonry",
        (0.0, 13.55, 0.0),
        rotation=(0.0, 0.0, -pi / 2),
    )
    base.instance_asset(
        "FinalRouteRunnerPath",
        assembly,
        "FinalRouteRunner",
        (0.0, 0.0, 0.075),
    )


def instance_project_displays(assembly):
    frame_support = create_story_cluster(
        assembly,
        "ProjectDisplayCluster01",
        (3.03, 2.55, 0.0),
        "future project curator",
        "reserved a framed presentation surface for approved project media",
        "the frame remains content-neutral until project selection",
    )
    base.instance_asset(
        "ProjectFrameSupport",
        frame_support,
        "ProjectFrameSupport01",
        (0.0, 0.0, 0.0),
        rotation=(0.0, 0.0, pi),
    )
    create_display_surface(
        frame_support,
        "ProjectInteractionSurface_01",
        (-0.245, 0.0, 1.7),
        1.72,
        2.15,
        "x",
    )

    niche_support = create_story_cluster(
        assembly,
        "ProjectDisplayCluster02",
        (-3.03, 6.25, 0.0),
        "future project curator",
        "reserved an illuminated manuscript niche and reading stand",
        "the manuscript surface remains neutral and replaceable",
    )
    base.instance_asset(
        "ProjectNicheSupport",
        niche_support,
        "ProjectNicheSupport02",
        (0.0, 0.0, 0.0),
    )
    create_display_surface(
        niche_support,
        "ProjectInteractionSurface_02",
        (0.225, 0.0, 1.64),
        1.75,
        2.02,
        "x",
    )
    base.instance_asset(
        "Lectern",
        niche_support,
        "ProjectLectern02",
        (0.9, 0.0, 0.0),
        rotation=(0.0, 0.0, pi / 2),
        scale=(0.82, 0.82, 0.82),
    )

    archive_support = create_story_cluster(
        assembly,
        "ProjectDisplayCluster03",
        (3.03, 9.55, 0.0),
        "future project curator",
        "reserved an archive cabinet and review surface",
        "drawers and presentation surface await approved material",
    )
    base.instance_asset(
        "ArchiveDisplaySupport",
        archive_support,
        "ArchiveDisplaySupport03",
        (0.0, 0.0, 0.0),
        rotation=(0.0, 0.0, pi),
    )
    base.instance_asset(
        "ProjectFrameSupport",
        archive_support,
        "ProjectFrameSupport03",
        (0.02, 0.0, 1.05),
        rotation=(0.0, 0.0, pi),
        scale=(0.9, 0.94, 0.86),
    )
    create_display_surface(
        archive_support,
        "ProjectInteractionSurface_03",
        (-0.245, 0.0, 2.52),
        1.56,
        1.78,
        "x",
    )


def instance_project_dressing(assembly):
    book_names = (
        "FinalRouteBookA",
        "FinalRouteBookB",
        "FinalRouteBookC",
        "FinalRouteBookD",
    )

    for name, location, rotation in (
        ("ProjectBookshelfNorth", (2.68, 6.1, 0.0), -pi / 2),
        ("ProjectBookshelfSouth", (-2.68, 9.35, 0.0), pi / 2),
    ):
        cluster = create_story_cluster(
            assembly,
            f"{name}Cluster",
            location,
            "archive reader",
            "cross-referenced volumes beside the presentation sequence",
            "several books remain pulled forward for later comparison",
        )
        base.instance_asset(
            "FinalRouteBookshelf",
            cluster,
            name,
            (0.0, 0.0, 0.0),
            rotation=(0.0, 0.0, rotation),
            scale=(0.92, 0.92, 0.92),
        )

    desk_cluster = create_story_cluster(
        assembly,
        "ProjectReviewDeskCluster",
        (-2.2, 2.9, 0.0),
        "project reviewer",
        "compared notes with an open volume before leaving",
        "the chair line remains clear while papers stay on the side",
    )
    base.instance_asset(
        "ReadingDesk",
        desk_cluster,
        "ProjectReviewDesk",
        (0.0, 0.0, 0.0),
        rotation=(0.0, 0.0, pi / 2),
        scale=(0.86, 0.86, 0.86),
    )
    base.instance_asset(
        "OpenBook",
        desk_cluster,
        "ProjectReviewOpenBook",
        (0.7, 0.0, 0.88),
        rotation=(0.0, 0.0, pi / 2),
        scale=(0.62, 0.62, 0.62),
    )
    base.instance_asset(
        "LoosePapers",
        desk_cluster,
        "ProjectReviewPapers",
        (0.64, 0.34, 0.89),
        rotation=(0.0, 0.0, -0.14),
        scale=(0.58, 0.58, 0.58),
    )
    base.instance_asset(
        "CandleCluster",
        desk_cluster,
        "ProjectReviewCandles",
        (0.65, -0.33, 0.9),
        scale=(0.62, 0.62, 0.62),
    )

    for index, (x_position, y_position, scale) in enumerate(
        (
            (2.55, 11.15, 0.72),
            (-2.55, 4.5, 0.66),
        )
    ):
        cluster = create_story_cluster(
            assembly,
            f"ProjectBookStackCluster{index + 1}",
            (x_position, y_position, 0.0),
            "archive assistant",
            "staged reference volumes beside the next reading surface",
            "the stacks remain compact and outside circulation",
        )
        base.instance_asset(
            "BookStackLow",
            cluster,
            f"ProjectBookStack_{index:02d}",
            (0.0, 0.0, 0.02),
            scale=(scale, scale, scale),
        )
        base.instance_asset(
            book_names[index],
            cluster,
            f"ProjectPulledBook_{index:02d}",
            (0.28, 0.18, 0.02),
            rotation=(0.0, pi / 2, 0.18),
            scale=(0.82, 0.82, 0.82),
        )

    for index, (x_position, y_position) in enumerate(
        ((0.0, 1.05), (0.0, 3.55), (0.0, 8.65))
    ):
        base.instance_asset(
            "HangingLantern",
            assembly,
            f"ProjectHangingLantern_{index:02d}",
            (x_position, y_position, 4.55),
            scale=(0.84, 0.84, 0.84),
        )

    base.instance_asset(
        "FinalRouteBookshelf",
        assembly,
        "ProjectEndArchiveShelf",
        (0.0, 13.08, 0.0),
        scale=(0.96, 0.96, 0.96),
    )
    base.instance_asset(
        "WallSconce",
        assembly,
        "ProjectWallSconce",
        (-3.0, 10.6, 1.95),
        rotation=(0.0, 0.0, pi / 2),
        scale=(0.78, 0.78, 0.78),
    )
    base.instance_asset(
        "FinalRouteIvy",
        assembly,
        "ProjectLocalizedIvy",
        (3.0, 12.2, 0.0),
        rotation=(0.0, 0.0, pi),
        scale=(0.72, 0.72, 0.72),
    )


def instance_social_architecture(assembly):
    for index, x_position in enumerate((-4.35, -6.85, -9.05)):
        base.instance_asset(
            "NarrowFloorBay",
            assembly,
            f"SocialFloor_{index:02d}",
            (x_position, 11.65, 0.0),
            rotation=(0.0, 0.0, pi / 2),
        )
        base.instance_asset(
            "NarrowVaultBay",
            assembly,
            f"SocialVault_{index:02d}",
            (x_position, 11.65, 0.0),
            rotation=(0.0, 0.0, pi / 2),
        )

    for side_index, y_position in enumerate((9.2, 14.1)):
        for index, x_position in enumerate((-4.35, -6.85)):
            if side_index == 1 and index == 1:
                continue

            base.instance_asset(
                "NarrowWallBay",
                assembly,
                f"SocialWall_{side_index:02d}_{index:02d}",
                (x_position, y_position, 0.0),
                rotation=(
                    0.0,
                    0.0,
                    pi / 2 if side_index == 0 else -pi / 2,
                ),
            )

    for index, y_position in enumerate((10.425, 12.875)):
        base.instance_asset(
            "NarrowWallBay",
            assembly,
            f"SocialWestMasonry_{index:02d}",
            (-10.5, y_position, 0.0),
        )
    base.instance_asset(
        "ContactThresholdArch",
        assembly,
        "SocialToContactArch",
        (-8.0, 14.05, 0.0),
    )


def instance_social_support(assembly):
    social_cluster = create_story_cluster(
        assembly,
        "SocialCorrespondenceCluster",
        (-10.18, 11.65, 0.0),
        "future correspondent",
        "reserved three labelled correspondence cards for approved links",
        "all three cards remain deliberately unconfigured",
    )
    base.instance_asset(
        "ReadingDesk",
        social_cluster,
        "SocialWritingDesk",
        (0.72, 0.0, 0.0),
        rotation=(0.0, 0.0, pi / 2),
        scale=(0.8, 0.8, 0.8),
    )

    for index, y_position in enumerate((-0.92, 0.0, 0.92), start=1):
        base.create_box(
            f"SocialPlaqueFrame_{index:02d}",
            (0.16, 0.76, 0.94),
            (0.0, y_position, 1.55),
            base.MATERIALS["brass"],
            social_cluster,
            bevel=0.022,
        )
        create_display_surface(
            social_cluster,
            f"SocialInteractionSurface_{index:02d}",
            (0.095, y_position, 1.55),
            0.62,
            0.78,
            "x",
        )

    base.instance_asset(
        "Notebook",
        social_cluster,
        "SocialDeskNotebook",
        (1.03, -0.22, 0.88),
        rotation=(0.0, 0.0, 0.16),
        scale=(0.68, 0.68, 0.68),
    )
    base.instance_asset(
        "LoosePapers",
        social_cluster,
        "SocialDeskCorrespondence",
        (1.01, 0.26, 0.89),
        rotation=(0.0, 0.0, -0.12),
        scale=(0.58, 0.58, 0.58),
    )
    base.instance_asset(
        "CandleSingle",
        social_cluster,
        "SocialDeskCandle",
        (0.98, 0.48, 0.9),
        scale=(0.72, 0.72, 0.72),
    )
    base.instance_asset(
        "WallSconce",
        assembly,
        "SocialWallSconce",
        (-10.18, 13.35, 1.85),
        rotation=(0.0, 0.0, pi / 2),
        scale=(0.78, 0.78, 0.78),
    )
    base.instance_asset(
        "FinalRouteGroundGrowth",
        assembly,
        "SocialLocalizedGrowth",
        (-9.95, 9.62, 0.0),
        rotation=(0.0, 0.0, 0.32),
        scale=(0.78, 0.78, 0.78),
    )


def instance_contact_architecture(assembly):
    contact_bay_centers = (15.3, 17.8, 19.15)

    for index, y_position in enumerate(contact_bay_centers):
        base.instance_asset(
            "NarrowFloorBay",
            assembly,
            f"ContactFloor_{index:02d}",
            (-8.0, y_position, 0.0),
        )
        base.instance_asset(
            "NarrowVaultBay",
            assembly,
            f"ContactVault_{index:02d}",
            (-8.0, y_position, 0.0),
            scale=(1.05, 1.0, 1.05),
        )

        base.instance_asset(
            "NarrowWallBay",
            assembly,
            f"ContactLeftWall_{index:02d}",
            (-10.5, y_position, 0.0),
        )
        base.instance_asset(
            "NarrowWallBay",
            assembly,
            f"ContactRightWall_{index:02d}",
            (-5.5, y_position, 0.0),
            rotation=(0.0, 0.0, pi),
        )

    base.instance_asset(
        "UnfinishedThresholdArch",
        assembly,
        "FinalUnfinishedThreshold",
        (-8.0, 20.4, 0.0),
    )

    base.create_box(
        "UnfinishedStoneBarrier",
        (2.35, 0.72, 1.05),
        (-8.0, 20.9, 0.53),
        base.MATERIALS["stone_worn"],
        assembly,
        bevel=0.07,
        rotation=(0.0, 0.0, -0.035),
    )
    for index, (x_position, z_position, scale) in enumerate(
        (
            (-8.82, 1.18, 0.86),
            (-7.95, 1.12, 0.72),
            (-7.2, 1.2, 0.8),
        )
    ):
        base.create_box(
            f"UnfinishedMasonryBlock_{index:02d}",
            (0.72 * scale, 0.62, 0.58 * scale),
            (x_position, 20.72, z_position),
            base.MATERIALS[
                "stone_worn" if index == 1 else "stone"
            ],
            assembly,
            bevel=0.055,
            rotation=(0.03 * index, 0.0, 0.08 - index * 0.07),
        )

    for index, x_position in enumerate((-8.72, -7.28)):
        base.create_box(
            f"UnfinishedTimberBrace_{index:02d}",
            (0.18, 0.22, 3.15),
            (x_position, 20.12, 2.15),
            base.MATERIALS["wood_dark"],
            assembly,
            bevel=0.026,
            rotation=(0.0, radians(8 if index == 0 else -8), 0.0),
        )

    base.instance_asset(
        "NarrowFloorBay",
        assembly,
        "UnfinishedVisibleFloor",
        (-8.0, 21.65, 0.0),
    )
    base.instance_asset(
        "NarrowVaultBay",
        assembly,
        "UnfinishedVaultContinuation",
        (-8.0, 21.65, 0.0),
        scale=(1.05, 1.0, 1.05),
    )
    for side, x_position in (("Left", -10.5), ("Right", -5.5)):
        base.instance_asset(
            "NarrowWallBay",
            assembly,
            f"Unfinished{side}ReturnWall",
            (x_position, 21.65, 0.0),
            rotation=(0.0, 0.0, 0.0 if side == "Left" else pi),
        )
    base.instance_asset(
        "DistantClosureWallBay",
        assembly,
        "UnfinishedDistantMasonry",
        (-8.0, 22.9, 0.0),
        rotation=(0.0, 0.0, -pi / 2),
    )


def instance_contact_support(assembly):
    contact_cluster = create_story_cluster(
        assembly,
        "ContactWritingStationCluster",
        (-10.05, 17.15, 0.0),
        "future correspondent",
        "reserved a writing station for approved contact details",
        "the action remains inactive until a destination is approved",
    )
    base.instance_asset(
        "ReadingDesk",
        contact_cluster,
        "ContactWritingDesk",
        (0.0, 0.0, 0.0),
        rotation=(0.0, 0.0, pi / 2),
        scale=(0.86, 0.86, 0.86),
    )
    base.instance_asset(
        "ProjectFrameSupport",
        contact_cluster,
        "ContactFrameSupport",
        (-0.28, 0.0, 0.72),
        scale=(0.7, 0.74, 0.62),
    )
    create_display_surface(
        contact_cluster,
        "ContactInteractionSurface",
        (-0.08, 0.0, 1.75),
        1.18,
        1.32,
        "x",
    )
    base.instance_asset(
        "OpenBook",
        contact_cluster,
        "ContactOpenBook",
        (0.37, -0.26, 0.91),
        rotation=(0.0, 0.0, pi / 2),
        scale=(0.6, 0.6, 0.6),
    )
    base.instance_asset(
        "Notebook",
        contact_cluster,
        "ContactNotebook",
        (0.35, 0.28, 0.91),
        rotation=(0.0, 0.0, -0.12),
        scale=(0.64, 0.64, 0.64),
    )
    base.instance_asset(
        "CandleCluster",
        contact_cluster,
        "ContactCandleCluster",
        (0.35, 0.48, 0.91),
        scale=(0.6, 0.6, 0.6),
    )
    base.instance_asset(
        "HangingLantern",
        assembly,
        "ContactHangingLantern",
        (-8.0, 17.35, 3.85),
        scale=(0.8, 0.8, 0.8),
    )

    future_cluster = create_story_cluster(
        assembly,
        "UnfinishedWorkCluster",
        (-9.7, 19.75, 0.0),
        "building craftsperson",
        "left measured drawings beside the closed construction threshold",
        "the plans suggest future work without promising a finished wing",
    )
    base.instance_asset(
        "LoosePapers",
        future_cluster,
        "UnfinishedMeasuredDrawings",
        (0.0, 0.0, 0.04),
        rotation=(0.0, 0.0, 0.18),
        scale=(0.82, 0.82, 0.82),
    )
    base.instance_asset(
        "BookStackLow",
        future_cluster,
        "UnfinishedReferenceStack",
        (0.42, 0.25, 0.03),
        rotation=(0.0, 0.0, -0.08),
        scale=(0.62, 0.62, 0.62),
    )


def create_final_route_assembly():
    assembly = base.create_root(
        "FinalRouteAssetLibraryAssembly",
        "scene_assembly",
    )
    assembly["scope"] = (
        "project gallery, social networks section, "
        "contact and unfinished wing ending"
    )
    assembly["forward_axis"] = (
        "+Y in Blender, -Z in React Three Fiber before placement rotation"
    )
    assembly["preserved_sections"] = (
        "welcome entrance and Provenance Gallery remain separate and unchanged"
    )
    assembly["project_slot_count"] = 3
    assembly["social_slot_count"] = 3

    instance_project_architecture(assembly)
    instance_project_displays(assembly)
    instance_project_dressing(assembly)
    instance_social_architecture(assembly)
    instance_social_support(assembly)
    instance_contact_architecture(assembly)
    instance_contact_support(assembly)
    return assembly


def validate_interior_wall_orientation():
    expected_rotations = {
        "ProjectGalleryRightWall_00": pi,
        "ProjectGalleryLeftWall_00": 0.0,
        "ProjectGalleryEndMasonry": -pi / 2,
        "SocialWall_00_00": pi / 2,
        "SocialWall_01_00": -pi / 2,
        "ContactLeftWall_00": 0.0,
        "ContactRightWall_00": pi,
        "UnfinishedLeftReturnWall": 0.0,
        "UnfinishedRightReturnWall": pi,
        "UnfinishedDistantMasonry": -pi / 2,
    }
    violations = []

    for object_name, expected_rotation in expected_rotations.items():
        object_ = bpy.data.objects.get(object_name)

        if object_ is None:
            violations.append(f"{object_name}:missing")
            continue

        rotation_delta = (
            object_.rotation_euler.z - expected_rotation + pi
        ) % (2 * pi) - pi

        if abs(rotation_delta) > radians(0.5):
            violations.append(
                f"{object_name}:{object_.rotation_euler.z:.3f}"
            )

    return violations


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
    scene.world.color = (0.005, 0.007, 0.009)

    try:
        scene.view_settings.look = "AgX - Medium High Contrast"
    except TypeError:
        pass

    camera_data = bpy.data.cameras.new("FinalRoutePreviewCamera")
    camera = bpy.data.objects.new("FinalRoutePreviewCamera", camera_data)
    scene.collection.objects.link(camera)
    camera.location = (0.15, -0.8, 1.68)
    camera_data.lens = 31
    look_at(camera, (0.0, 8.8, 1.8))
    scene.camera = camera

    warm_data = bpy.data.lights.new("FinalRoutePreviewWarm", "AREA")
    warm_data.energy = 470
    warm_data.color = (1.0, 0.39, 0.13)
    warm_data.shape = "DISK"
    warm_data.size = 2.8
    warm = bpy.data.objects.new("FinalRoutePreviewWarm", warm_data)
    scene.collection.objects.link(warm)
    warm.location = (-1.8, 3.4, 3.8)
    look_at(warm, (0.0, 4.5, 1.5))

    secondary_data = bpy.data.lights.new(
        "FinalRoutePreviewSecondary",
        "POINT",
    )
    secondary_data.energy = 150
    secondary_data.color = (1.0, 0.29, 0.08)
    secondary_data.shadow_soft_size = 0.9
    secondary = bpy.data.objects.new(
        "FinalRoutePreviewSecondary",
        secondary_data,
    )
    scene.collection.objects.link(secondary)
    secondary.location = (1.5, 8.7, 2.4)

    cool_data = bpy.data.lights.new("FinalRoutePreviewCool", "AREA")
    cool_data.energy = 520
    cool_data.color = (0.39, 0.5, 0.56)
    cool_data.shape = "DISK"
    cool_data.size = 2.6
    cool = bpy.data.objects.new("FinalRoutePreviewCool", cool_data)
    scene.collection.objects.link(cool)
    cool.location = (-2.2, 12.7, 3.2)
    look_at(cool, (-2.0, 10.5, 1.7))

    if os.environ.get("BLENDER_SKIP_PREVIEW_RENDER") != "1":
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


def point_to_rectangle_distance(x_position, y_position, bounds):
    minimum_x, maximum_x, minimum_y, maximum_y, _, _ = bounds
    x_distance = max(
        minimum_x - x_position,
        0.0,
        x_position - maximum_x,
    )
    y_distance = max(
        minimum_y - y_position,
        0.0,
        y_position - maximum_y,
    )
    return (x_distance * x_distance + y_distance * y_distance) ** 0.5


def route_samples():
    route_points = (
        (0.0, 0.0),
        (0.0, 9.8),
        (-0.05, 10.2),
        (-0.6, 10.75),
        (-1.3, 11.2),
        (-2.3, 11.6),
        (-3.0, 11.7),
        (-4.4, 11.7),
        (-6.5, 11.7),
        (-7.1, 11.8),
        (-7.7, 12.2),
        (-8.0, 13.1),
        (-8.0, 14.0),
        (-8.0, 18.6),
    )
    samples = []

    for start, end in zip(route_points, route_points[1:]):
        for index in range(21):
            amount = index / 20
            samples.append(
                (
                    start[0] + (end[0] - start[0]) * amount,
                    start[1] + (end[1] - start[1]) * amount,
                )
            )

    return samples


def validate_prop_clearance():
    violations = []
    bounds_by_cluster = {}
    samples = route_samples()

    for cluster in PROP_GROUPS:
        bounds = combined_bounds(cluster)
        bounds_by_cluster[cluster.name] = bounds

        if bounds is None:
            continue

        _, _, _, _, minimum_z, maximum_z = bounds
        overlaps_camera_height = minimum_z < 2.25 and maximum_z > 0.0
        minimum_distance = min(
            point_to_rectangle_distance(x, y, bounds)
            for x, y in samples
        )

        if overlaps_camera_height and minimum_distance < ROUTE_HALF_WIDTH:
            violations.append(
                f"{cluster.name}:{minimum_distance:.3f}m"
            )

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
        "approved project gallery, social section, "
        "contact and unfinished wing ending"
    )
    scene["validated_entrance_modified"] = False
    scene["validated_provenance_gallery_modified"] = False

    base.create_material_library()
    create_asset_library()
    assembly = create_final_route_assembly()
    wall_orientation_violations = validate_interior_wall_orientation()

    if wall_orientation_violations:
        raise RuntimeError(
            "Final route wall modules face away from the interior: "
            + ", ".join(wall_orientation_violations)
        )

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
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_draco_position_quantization=14,
        export_draco_normal_quantization=10,
        export_draco_texcoord_quantization=12,
        export_lights=False,
        export_extras=True,
    )

    print(f"FINAL_ROUTE_BLEND={BLEND_PATH}")
    print(f"FINAL_ROUTE_GLB={GLB_PATH}")
    print(f"FINAL_ROUTE_PREVIEW={PREVIEW_PATH}")
    print(f"FINAL_ROUTE_GLB_BYTES={GLB_PATH.stat().st_size}")
    print(
        "FINAL_ROUTE_ASSEMBLY_TRIANGLES="
        f"{assembly_triangle_count(assembly)}"
    )
    print(
        "FINAL_ROUTE_ASSEMBLY_MESHES="
        f"{sum(1 for child in assembly.children_recursive if child.type == 'MESH')}"
    )
    print(f"FINAL_ROUTE_PROP_BOUNDS={bounds_by_cluster}")
    print(f"FINAL_ROUTE_PROP_CLEARANCE_VIOLATIONS={violations}")

    if violations:
        raise RuntimeError(
            "Final route props enter the protected camera route: "
            + ", ".join(violations)
        )


if __name__ == "__main__":
    main()
