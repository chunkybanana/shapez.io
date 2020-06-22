import { BaseHUDPart } from "../base_hud_part";
import { makeDiv } from "../../../core/utils";
import { TrackedState } from "../../../core/tracked_state";
import { enumColors } from "../../colors";
import { ColorItem } from "../../items/color_item";
import { DrawParameters } from "../../../core/draw_parameters";
import { THEME } from "../../theme";
import { globalConfig } from "../../../core/config";
import { T } from "../../../translations";

export class HUDColorBlindHelper extends BaseHUDPart {
    createElements(parent) {
        this.belowTileIndicator = makeDiv(parent, "ingame_HUD_ColorBlindBelowTileHelper", []);
    }

    initialize() {
        this.trackedColorBelowTile = new TrackedState(this.onColorBelowTileChanged, this);
    }

    /**
     * Called when the color below the current tile changed
     * @param {enumColors|null} color
     */
    onColorBelowTileChanged(color) {
        this.belowTileIndicator.classList.toggle("visible", !!color);
        if (color) {
            this.belowTileIndicator.innerText = T.ingame.colors[color];
        }
    }

    /**
     * Computes the color below the current tile
     * @returns {enumColors}
     */
    computeColorBelowTile() {
        const mousePosition = this.root.app.mousePosition;
        if (!mousePosition) {
            // Not on screen
            return null;
        }

        const worldPos = this.root.camera.screenToWorld(mousePosition);
        const tile = worldPos.toTileSpace();
        const contents = this.root.map.getTileContent(tile);

        if (contents && !contents.components.Miner) {
            const beltComp = contents.components.Belt;

            // Check if the belt has a color item
            if (beltComp) {
                const firstItem = beltComp.sortedItems[0];
                if (firstItem && firstItem[1] instanceof ColorItem) {
                    return firstItem[1].color;
                }
            }

            // Check if we are ejecting an item, if so use that color
            const ejectorComp = contents.components.ItemEjector;
            if (ejectorComp) {
                for (let i = 0; i < ejectorComp.slots.length; ++i) {
                    const slot = ejectorComp.slots[i];
                    if (slot.item && slot.item instanceof ColorItem) {
                        return slot.item.color;
                    }
                }
            }
        } else {
            // We hovered a lower layer, show the color there
            const lowerLayer = this.root.map.getLowerLayerContentXY(tile.x, tile.y);
            if (lowerLayer && lowerLayer instanceof ColorItem) {
                return lowerLayer.color;
            }
        }

        return null;
    }

    update() {
        this.trackedColorBelowTile.set(this.computeColorBelowTile());
    }

    /**
     * Draws the currently selected tile
     * @param {DrawParameters} parameters
     */
    draw(parameters) {
        const mousePosition = this.root.app.mousePosition;
        if (!mousePosition) {
            // Not on screen
            return null;
        }

        const below = this.computeColorBelowTile();
        if (below) {
            // We have something below our tile
            const worldPos = this.root.camera.screenToWorld(mousePosition);
            const tile = worldPos.toTileSpace().toWorldSpace();

            parameters.context.strokeStyle = THEME.map.colorBlindPickerTile;
            parameters.context.lineWidth = 1;
            parameters.context.beginPath();
            parameters.context.rect(tile.x, tile.y, globalConfig.tileSize, globalConfig.tileSize);
            parameters.context.stroke();
        }
    }
}
