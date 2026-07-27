from hashlib import sha256
from pathlib import Path
from re import search
from shutil import which
from subprocess import run
from urllib.request import Request, urlopen


PROJECT_ROOT = Path(__file__).resolve().parents[2]
TEXTURE_DIRECTORY = PROJECT_ROOT / "assets" / "textures" / "entrance"

TEXTURE_FILES = {
    "dark_wood_diff_1k.jpg": (
        "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/"
        "dark_wood/dark_wood_diff_1k.jpg"
    ),
    "dark_wood_nor_gl_1k.jpg": (
        "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/"
        "dark_wood/dark_wood_nor_gl_1k.jpg"
    ),
    "dark_wood_rough_512.jpg": (
        "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/"
        "dark_wood/dark_wood_rough_1k.jpg"
    ),
    "leather_red_02_coll1_1k.jpg": (
        "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/"
        "leather_red_02/leather_red_02_coll1_1k.jpg"
    ),
    "leather_red_02_nor_gl_1k.jpg": (
        "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/"
        "leather_red_02/leather_red_02_nor_gl_1k.jpg"
    ),
    "leather_red_02_rough_512.jpg": (
        "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/"
        "leather_red_02/leather_red_02_rough_1k.jpg"
    ),
    "medieval_blocks_03_diff_1k.jpg": (
        "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/"
        "medieval_blocks_03/medieval_blocks_03_diff_1k.jpg"
    ),
    "medieval_blocks_03_nor_gl_1k.jpg": (
        "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/"
        "medieval_blocks_03/medieval_blocks_03_nor_gl_1k.jpg"
    ),
    "medieval_blocks_03_rough_512.jpg": (
        "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/"
        "medieval_blocks_03/medieval_blocks_03_rough_1k.jpg"
    ),
    "quatrefoil_jacquard_fabric_nor_gl_1k.jpg": (
        "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/"
        "quatrefoil_jacquard_fabric/"
        "quatrefoil_jacquard_fabric_nor_gl_1k.jpg"
    ),
    "stone_tiles_02_diff_1k.jpg": (
        "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/"
        "stone_tiles_02/stone_tiles_02_diff_1k.jpg"
    ),
    "stone_tiles_02_nor_gl_1k.jpg": (
        "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/"
        "stone_tiles_02/stone_tiles_02_nor_gl_1k.jpg"
    ),
    "stone_tiles_02_rough_512.jpg": (
        "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/"
        "stone_tiles_02/stone_tiles_02_rough_1k.jpg"
    ),
}


def optimize_roughness(file_name, file_path):
    if "_rough_512" not in file_name:
        return

    sips_path = which("sips")

    if sips_path is None:
        raise RuntimeError("sips is required to optimize roughness maps")

    inspection = run(
        [sips_path, "-g", "pixelWidth", str(file_path)],
        check=True,
        capture_output=True,
        text=True,
    )
    width_match = search(r"pixelWidth: (\d+)", inspection.stdout)

    if width_match is None:
        raise RuntimeError(f"Unable to inspect texture size: {file_path}")

    if int(width_match.group(1)) > 512:
        run(
            [sips_path, "-Z", "512", str(file_path)],
            check=True,
            capture_output=True,
            text=True,
        )


def file_digest(file_path):
    digest = sha256()

    with file_path.open("rb") as source_file:
        for chunk in iter(lambda: source_file.read(1024 * 1024), b""):
            digest.update(chunk)

    return digest.hexdigest()


def download_file(file_name, url):
    destination = TEXTURE_DIRECTORY / file_name

    if destination.exists() and destination.stat().st_size > 0:
        optimize_roughness(file_name, destination)
        print(
            f"TEXTURE_READY={destination.name} "
            f"sha256={file_digest(destination)}"
        )
        return

    request = Request(url, headers={"User-Agent": "portfolio-3d-lionel"})
    temporary_path = destination.with_suffix(f"{destination.suffix}.download")

    with urlopen(request, timeout=60) as response:
        temporary_path.write_bytes(response.read())

    temporary_path.replace(destination)
    optimize_roughness(file_name, destination)
    print(
        f"TEXTURE_DOWNLOADED={destination.name} "
        f"sha256={file_digest(destination)}"
    )


def main():
    TEXTURE_DIRECTORY.mkdir(parents=True, exist_ok=True)

    for file_name, url in TEXTURE_FILES.items():
        download_file(file_name, url)

    print(f"TEXTURE_COUNT={len(TEXTURE_FILES)}")
    print(f"TEXTURE_DIRECTORY={TEXTURE_DIRECTORY}")


if __name__ == "__main__":
    main()
