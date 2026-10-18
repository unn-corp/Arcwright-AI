"""Observable regression cases for persisted design recommendations."""

import copy
import json
from pathlib import Path
import re
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from design_system import DesignSystemGenerator, format_master_md, persist_design_system


def luminance(color):
    if color == "white":
        color = "#FFFFFF"
    elif color == "black":
        color = "#000000"
    channels = [int(color[index:index + 2], 16) / 255 for index in (1, 3, 5)]
    linear = [value / 12.92 if value <= 0.04045 else ((value + 0.055) / 1.055) ** 2.4
              for value in channels]
    return sum(value * weight for value, weight in zip(linear, (0.2126, 0.7152, 0.0722)))


class PersistedDesignTests(unittest.TestCase):
    def setUp(self):
        self.design = json.loads((Path(__file__).parent / "fixtures/arcwright-generator.json").read_text())

    def test_existing_master_is_preserved(self):
        with tempfile.TemporaryDirectory() as folder:
            first = persist_design_system(self.design, output_dir=folder)
            master = Path(first["design_system_dir"]) / "MASTER.md"
            master.write_text("Reviewed design decisions\n")
            persist_design_system(self.design, output_dir=folder)
            self.assertEqual(master.read_text(), "Reviewed design decisions\n")

    def test_project_and_page_names_stay_in_their_output_directories(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder) / "workspace"
            root.mkdir()
            design = copy.deepcopy(self.design)
            design["project_name"] = "../../escape"
            result = persist_design_system(design, page="../escape-page", output_dir=root)
            directory = Path(result["design_system_dir"]).resolve()
            self.assertTrue(directory.is_relative_to((root / "design-system").resolve()))
            pages = [Path(path).resolve() for path in result["created_files"]
                     if Path(path).name != "MASTER.md"]
            self.assertEqual(len(pages), 1)
            self.assertTrue(pages[0].is_relative_to(directory / "pages"))

    def test_generated_primary_button_has_readable_text(self):
        markdown = format_master_md(self.design)
        button = re.search(r"\.btn-primary\s*\{([^}]+)\}", markdown).group(1)
        background = re.search(r"background:\s*([^;]+);", button).group(1).strip()
        foreground = re.search(r"(?<!-)color:\s*([^;]+);", button).group(1).strip()
        bright, dark = sorted((luminance(background), luminance(foreground)), reverse=True)
        self.assertGreaterEqual((bright + 0.05) / (dark + 0.05), 4.5)

    def test_explicit_dark_request_uses_a_dark_background(self):
        result = DesignSystemGenerator().generate("dark SaaS dashboard", "Dark Fixture")
        self.assertLess(luminance(result["colors"]["background"]), 0.15)


if __name__ == "__main__":
    unittest.main()
