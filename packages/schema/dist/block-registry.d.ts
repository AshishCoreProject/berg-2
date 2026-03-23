/**
 * Block registry: default attributes and metadata per block type.
 * Single source of truth for builder UI and renderer.
 */
import type { BlockType } from './types.js';
export interface BlockDefinition {
    type: BlockType;
    label: string;
    category: 'text' | 'media' | 'design' | 'layout' | 'store' | 'form';
    defaultAttributes: Record<string, unknown>;
    /** For SEO: which HTML tag to use (e.g. heading level). */
    semanticTag?: string;
}
export declare const BLOCK_REGISTRY: Record<BlockType, BlockDefinition>;
export declare function getBlockDefinition(type: BlockType): BlockDefinition;
export declare function getBlocksByCategory(category: BlockDefinition['category']): BlockDefinition[];
//# sourceMappingURL=block-registry.d.ts.map