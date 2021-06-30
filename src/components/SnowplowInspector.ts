import { Entry } from "har-format";
import m = require("mithril");
import { Application } from "../ts/types";
import BadRowsModal = require("./Modals/BadRowsModal");
import LiveStreamModal = require("./Modals/LiveStreamModal");
import Debugger = require("./Debugger");
import SchemaManager = require("./SchemaManager");
import Toolbar = require("./Toolbar");

const SnowplowInspector = () => {
  let modal: string | undefined;
  let application: Application = "debugger";

  const events: Entry[] = [];

  function setModal(modalName?: string) {
    modal = modalName;
  }

  function addRequests(reqs: Entry[]) {
    events.push.apply(events, reqs);
  }

  function changeApp(app: Application) {
    application = app;
  }

  return {
    view: () => {
      let app;
      switch (application) {
        case "debugger":
          app = m(Debugger, { events, addRequests });
          break;
        case "schemaManager":
          app = m(SchemaManager);
          break;
      }

      return [
        m(Toolbar, {
          addRequests,
          changeApp,
          clearRequests: () => (events.length = 0),
          setModal,
        }),
        app,
        m(BadRowsModal, {
          addRequests,
          modal,
          setModal,
        }),
        m(LiveStreamModal, {
          addRequests,
          modal,
          setModal,
        }),
      ];
    },
  };
};

export = SnowplowInspector;
