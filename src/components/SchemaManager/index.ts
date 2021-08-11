import { default as m, Vnode } from "mithril";

import { Registry, Resolver } from "../../ts/iglu";
import { ModalSetter } from "../../components/Modals";

import { Directory } from "./Directory";
import { RegistryList } from "./RegistryList";

type Filter = {
  search?: RegExp;
  selections: Registry[];
};

export const SchemaManager = (
  vnode: Vnode<{
    resolver: Resolver;
    setModal: ModalSetter;
  }>
) => {
  const filters: Filter = {
    search: undefined,
    selections: [],
  };

  const filterRegistries = (selected: Registry[]) =>
    (filters.selections = selected);

  const clearSearch = () => (filters.search = undefined);

  let doUpdate = false;
  const requestUpdate = (request?: boolean): boolean => {
    if (typeof request === "undefined") return doUpdate;
    return (doUpdate = request);
  };

  return {
    view: () =>
      m(
        "section.schema-manager.columns.section",
        m(
          Directory,
          { ...filters, requestUpdate, ...vnode.attrs },
          m("input.filterPanel[search]", {
            placeholder: "Filter Pattern",
            title: "Regular expression to search schemas for",
            onkeyup: (event: KeyboardEvent) => {
              const target = event.target;
              if (!(target instanceof HTMLInputElement)) return;
              const val = target.value;
              if (!val.trim()) return (filters.search = undefined);

              try {
                const re = new RegExp(val, "im");
                target.setCustomValidity("");
                filters.search = re;
              } catch {
                target.setCustomValidity("Invalid regular expression");
                target.reportValidity();
              }
            },
          })
        ),
        m(RegistryList, {
          filterRegistries,
          clearSearch,
          requestUpdate,
          ...vnode.attrs,
        })
      ),
  };
};
