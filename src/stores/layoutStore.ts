import { create } from 'zustand';

export interface PageMeta {
  navKey?: string | null;
  titleKey?: string;
  namespaceKey?: string;
}

const defaultPageMeta: PageMeta = {
  navKey: 'dashboard',
  titleKey: 'navigation:pageTitle.dashboard',
  namespaceKey: 'dashboard',
};

interface LayoutState {
  pageMeta: PageMeta;
  setPageMeta: (meta: PageMeta) => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  pageMeta: defaultPageMeta,
  setPageMeta: (meta) => set({
    pageMeta: {
      ...defaultPageMeta,
      ...meta,
    },
  }),
}));

export const setLayoutPageMeta = (meta: PageMeta) => {
  useLayoutStore.getState().setPageMeta(meta);
};

export { defaultPageMeta };
