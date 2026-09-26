import {getClass} from "../maki/objects.js";
import BaseObject from "./makiClasses/BaseObject.js";
import Button from "./makiClasses/Button.js";
import SystemObject from "./makiClasses/SystemObject.js";
import Container from "./makiClasses/Container.js";
import Layout from "./makiClasses/Layout.js";
import Layer from "./makiClasses/Layer.js";
import AnimatedLayer from "./makiClasses/AnimatedLayer.js";
import PopupMenu from "./makiClasses/PopupMenu.js";
import ToggleButton from "./makiClasses/ToggleButton.js";
import LayoutStatus from "./makiClasses/LayoutStatus.js";
import Status from "./makiClasses/Status.js";
import Text from "./makiClasses/Text.js";
import Menu from "./makiClasses/Menu.js";
import Frame from "./makiClasses/Frame.js";
import Group from "./makiClasses/Group.js";
import MakiMap from "./makiClasses/MakiMap.js";
import MakiList from "./makiClasses/List.js";
import BitList from "./makiClasses/BitList.js";
import GroupList from "./makiClasses/GroupList.js";
import CfgGroup from "./makiClasses/CfgGroup.js";
import TabSheet from "./makiClasses/TabSheet.js";
import MouseRedir from "./makiClasses/MouseRedir.js";
import DropDownList from "./makiClasses/DropDownList.js";
import Edit from "./makiClasses/Edit.js";
import Browser from "./makiClasses/Browser.js";
import Wac from "./makiClasses/Wac.js";
import QueryList from "./makiClasses/QueryList.js";
import GuiList from "./makiClasses/GuiList.js";
import GuiTree from "./makiClasses/GuiTree.js";
import TreeItem from "./makiClasses/TreeItem.js";
import CheckBox from "./makiClasses/CheckBox.js";
import Timer from "./makiClasses/Timer.js";
import Slider from "./makiClasses/Slider.js";
import Vis from "./makiClasses/Vis.js";
import EqVis from "./makiClasses/EqVis.js";
import GuiObj from "./makiClasses/GuiObj.js";
import Config from "./makiClasses/Config.js";
import ConfigItem from "./makiClasses/ConfigItem.js";
import ConfigAttribute from "./makiClasses/ConfigAttribute.js";
import WinampConfig, {WinampConfigGroup} from "./makiClasses/WinampConfig.js";
import ComponentBucket from "./makiClasses/ComponentBucket.js";
import AlbumArt from "./makiClasses/AlbumArt.js";
import Region from "./makiClasses/Region.js";
import {PlEdit, PlDir} from "./makiClasses/PlayList.js";
import PlayListGui from "./makiClasses/PlayListGui.js";
import WasabiTitleBar from "./makiClasses/WasabiTitle.js";
import WindowHolder from "./makiClasses/WindowHolder.js";
import Application from "./makiClasses/Application.js";
import File from "./makiClasses/File.js";
import XmlDoc from "./makiClasses/XmlDoc.js";
const CLASSES = [
  BaseObject,
  Config,
  ConfigItem,
  ConfigAttribute,
  WinampConfig,
  WinampConfigGroup,
  ComponentBucket,
  Region,
  AlbumArt,
  Button,
  SystemObject,
  Container,
  Layout,
  Layer,
  AnimatedLayer,
  PopupMenu,
  ToggleButton,
  Status,
  LayoutStatus,
  Text,
  Menu,
  Frame,
  Group,
  MakiMap,
  MakiList,
  BitList,
  GroupList,
  CfgGroup,
  TabSheet,
  MouseRedir,
  DropDownList,
  Edit,
  Browser,
  Wac,
  QueryList,
  GuiList,
  GuiTree,
  TreeItem,
  CheckBox,
  Timer,
  Slider,
  Vis,
  EqVis,
  PlEdit,
  PlDir,
  PlayListGui,
  GuiObj,
  WasabiTitleBar,
  WindowHolder,
  Application,
  File,
  XmlDoc
];
const GUID_MAP = {};
for (const klass of CLASSES) {
  if (klass.GUID == null) {
    throw new Error("Expected GUID on class.");
  }
  GUID_MAP[klass.GUID.toLowerCase()] = klass;
}
export function classResolver(guid) {
  const klass = GUID_MAP[guid];
  if (klass == null) {
    throw new Error(`Unresolvable class "${getClass(guid).name}" (guid: ${guid})`);
  }
  return klass;
}
