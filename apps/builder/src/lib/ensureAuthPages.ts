import type { Block, PageDocument } from '@berg/schema';
import {
  SCHEMA_VERSION,
  createBlockId,
  createPageId,
  getBlockDefinition,
} from '@berg/schema';
import type { StoreData } from './storage';
import { autoPlace, getDefaultHeightForType } from './autoPlace';

function makeBlock(
  type: Block['type'],
  attrs: Record<string, unknown>,
  existingBlocks: Block[] = [],
): Block {
  const id = createBlockId();
  const def = getBlockDefinition(type);
  const defaultH = getDefaultHeightForType(type);
  const layout = autoPlace(existingBlocks, 12, defaultH);
  return {
    id,
    type,
    attributes: {
      ...def.defaultAttributes,
      ...attrs,
      layoutByViewport: {
        desktop: {
          x: layout.x,
          y: layout.y,
          w: layout.w,
          h: layout.h,
          minW: 1,
          minH: 1,
        },
        tablet: {
          x: layout.x,
          y: layout.y,
          w: layout.w,
          h: layout.h,
          minW: 1,
          minH: 1,
        },
        mobile: {
          x: layout.x,
          y: layout.y,
          w: layout.w,
          h: layout.h,
          minW: 1,
          minH: 1,
        },
      },
      gridColumnSpan: 12,
      gridColumnStart: 1,
    },
  };
}

function buildLoginPageBlocks(): Block[] {
  const blocks: Block[] = [];
  blocks.push(
    makeBlock(
      'core/heading',
      { content: 'Sign in', level: 2, textAlign: 'left' },
      blocks,
    ),
  );
  blocks.push(
    makeBlock(
      'store/customer-auth',
      {
        mode: 'login',
        alternatePrompt: "Don't have an account?",
        alternateLinkText: 'Create account',
        alternatePath: '/register',
        successRedirect: '/',
      },
      blocks,
    ),
  );
  return blocks;
}

function buildRegisterPageBlocks(): Block[] {
  const blocks: Block[] = [];
  blocks.push(
    makeBlock(
      'core/heading',
      { content: 'Create account', level: 2, textAlign: 'left' },
      blocks,
    ),
  );
  blocks.push(
    makeBlock(
      'store/customer-auth',
      {
        mode: 'register',
        alternatePrompt: 'Already have an account?',
        alternateLinkText: 'Sign in',
        alternatePath: '/login',
        successRedirect: '/login',
      },
      blocks,
    ),
  );
  return blocks;
}

/**
 * Ensures `login` and `register` pages exist (fixed routes for customer auth).
 */
export function ensureAuthPages(store: StoreData): StoreData {
  const hasLogin = store.pages.some((p) => p.slug === 'login');
  const hasRegister = store.pages.some((p) => p.slug === 'register');
  if (hasLogin && hasRegister) return store;

  let pages = [...store.pages];
  if (!hasLogin) {
    const id = createPageId();
    const document: PageDocument = {
      version: SCHEMA_VERSION,
      meta: { title: 'Sign in', description: 'Sign in to your account' },
      blocks: buildLoginPageBlocks(),
    };
    pages.push({ id, slug: 'login', document, published: true });
  }
  if (!hasRegister) {
    const id = createPageId();
    const document: PageDocument = {
      version: SCHEMA_VERSION,
      meta: { title: 'Create account', description: 'Register a new customer account' },
      blocks: buildRegisterPageBlocks(),
    };
    pages.push({ id, slug: 'register', document, published: true });
  }
  return { ...store, pages };
}
