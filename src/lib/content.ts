import { copy, message, firstUpperCase } from "../utils/utils";
import { CreateElement } from "../types/index";
import { request } from "./request";
import { btnType } from "../utils/dict";
import Compile from "./compile";

// 插件显示的内容，需要内嵌在网页，所以采用appendChild
export default class Content {
  toTsCompile: any; // 遍历转换对象
  prevValue: string; // 之前的值

  constructor() {
    this.toTsCompile = new Compile(location.href);
    // 保存之前的值，可以组合
    this.prevValue = "";
  }

  // 生成页面元素
  createElementFun(options: CreateElement) {
    let $div = document.createElement(options.elem);
    $div.innerText = options.innerText || "";
    // @ts-ignore
    $div.classList = options.classList || "";
    $div.type = options.type || "";

    return $div;
  }

  // 页面加载时执行
  contentLoad(e: any) {
    const target = e.target;

    // 主体框
    const $btnWrapper = this.createElementFun({ classList: "to-ts" });
    const $title = this.createBtnWrapper();
    const $input = this.createSeparator();
    const $queryBtn = this.createQueryBtn();
    const $bodyBtn = this.createBodyBtn();
    const $resBtn = this.createResBtn();
    const $queryAndResBtn = this.createQueryAndResBtn();
    const $bodyAndResBtn = this.createBodyAndResBtn();
    const $allBtn = this.createallBtn();

    $btnWrapper.appendChild($title);
    $btnWrapper.appendChild($input);
    $btnWrapper.appendChild($queryBtn);
    $btnWrapper.appendChild($bodyBtn);
    $btnWrapper.appendChild($resBtn);
    $btnWrapper.appendChild($queryAndResBtn);
    $btnWrapper.appendChild($bodyAndResBtn);
    $btnWrapper.appendChild($allBtn);
    target.body.appendChild($btnWrapper);
  }

  // 插件框标题
  createBtnWrapper() {
    const $title = this.createElementFun({
      elem: "h4",
      classList: "to-ts-title",
      innerText: "接口转为ts interface",
    });

    return $title;
  }

  // 类型分隔符，比如分号，逗号，空， '；' ' ，' ''
  createSeparator() {
    const $input = this.createElementFun({
      elem: "input",
      type: "text",
      classList: "separator",
    });
    const $inputWrapper = this.createElementFun({
      elem: "div",
      classList: "separator-wrapper",
      innerText: "每行分隔符",
    });
    $inputWrapper.appendChild($input);
    $input.value = this.toTsCompile.separator;
    $input.onblur = (e: any) => {
      this.toTsCompile.separator = e.target.value;
    };

    return $inputWrapper;
  }

  // 返回值转换按钮
  createResBtn() {
    const $resBtn = this.createElementFun({
      elem: "button",
      classList: "to-ts-res-btn",
      innerText: "返回值转换",
    });

    $resBtn.onclick = () => {
      this.clickCallBack($resBtn, "resBtn");
    };

    return $resBtn;
  }

  // Body参数按钮
  createBodyBtn() {
    // Body参数
    const $bodyBtn = this.createElementFun({
      elem: "button",
      classList: "to-ts-req-btn",
      innerText: "Body参数转换",
    });

    $bodyBtn.onclick = () => {
      this.clickCallBack($bodyBtn, "bodyBtn");
    };

    return $bodyBtn;
  }

  // 生成query参数按钮
  createQueryBtn() {
    // Query参数
    const $queryBtn = this.createElementFun({
      elem: "button",
      classList: "to-ts-query-btn",
      innerText: "Query参数转换",
    });

    $queryBtn.onclick = () => {
      this.clickCallBack($queryBtn, "queryBtn");
    };

    return $queryBtn;
  }

  // query跟res转换按钮
  createQueryAndResBtn() {
    const $queryAndResBtn = this.createElementFun({
      elem: "button",
      classList: "to-ts-req-btn and",
      innerText: "query和返回值转换",
    });

    $queryAndResBtn.onclick = () => {
      this.clickCallBack(
        $queryAndResBtn,
        "queryAndResBtn",
        "query和返回值转换"
      );
    };

    return $queryAndResBtn;
  }

  // body跟res转换按钮
  createBodyAndResBtn() {
    const $bodyAndResBtn = this.createElementFun({
      elem: "button",
      classList: "to-ts-req-btn and-body",
      innerText: "body和返回值转换",
    });

    $bodyAndResBtn.onclick = async () => {
      this.clickCallBack($bodyAndResBtn, "bodyAndResBtn", "body和返回值转换");
    };

    return $bodyAndResBtn;
  }

  // 有可能query，body, res都有(别问为什么，问后台)
  createallBtn() {
    const $allBtn = this.createElementFun({
      elem: "button",
      classList: "to-ts-req-btn and-all",
      innerText: "全部转换",
    });

    $allBtn.onclick = () => {
      this.clickCallBack($allBtn, "allBtn", "全部转换");
    };

    return $allBtn;
  }

  // 按钮点击后回调，生成interface返回
  async clickCallBack(element: any, type: string, innerText: string = "") {
    element.innerText = "转换中...";
    // 清空旧值
    this.prevValue = "";
    let result: any = await request();

    if (type === "queryAndResBtn") {
      this.callbackFunc(element, "queryBtn", false, innerText, result);
      this.callbackFunc(element, "resBtn", true, innerText, result);
    } else if (type === "bodyAndResBtn") {
      this.callbackFunc(element, "bodyBtn", false, innerText, result);
      this.callbackFunc(element, "resBtn", true, innerText, result);
    } else if (type === "allBtn") {
      this.callbackFunc(element, "queryBtn", false, innerText, result);
      this.callbackFunc(element, "bodyBtn", false, innerText, result);
      this.callbackFunc(element, "resBtn", true, innerText, result);
    } else {
      this.callbackFunc(element, type, false, innerText, result);
    }
  }

  // 接口回调
  callbackFunc(
    element: any,
    type: string,
    isAnd: boolean = false,
    innerText: string = "",
    result: any
  ) {
    try {
      result = JSON.parse(result).data;
      const title = result.title; // 接口名称
      let resBody = result[btnType[type].field];

      // 如果返回是个json字符串，需要解析
      if (typeof resBody === "string") {
        // 不能JSON.parse，因为存在注释, rollup强烈反对使用eval，用new Function代替
        resBody = new Function("return " + result[btnType[type].field])();
      }

      let compileType = "";
      // 老接口有.do，需要去掉
      const splitPath = result.path.replace(".do", "").split("/");
      // 获取接口名，生成的interface名跟接口名绑定
      const apiPath = splitPath[splitPath.length - 1];
      let interfaceName = apiPath;

      // 如果接口存在-,则去掉，并变成驼峰命名
      if (apiPath.indexOf("-") > -1) {
        const arr = apiPath.split("-");

        arr.forEach((item: string, index: number) => {
          if (index > 0) {
            arr[index] = firstUpperCase(item);
          }
        });
        interfaceName = arr.join("");
      }

      // 返回值跟参数分开做处理
      if (type === "resBtn") {
        interfaceName += "Res";
        if (result.res_body_is_json_schema) {
          // 当res_body_type字段为json时取resBody.properties，为raw时不做处理，就是resBody
          if (result.res_body_type === "json") {
            resBody = resBody.properties;
            compileType = "json_schema";
          }
        }
      } else if (type === "bodyBtn") {
        interfaceName += "Body";
        // post请求有两种，一种是form，一种是json,
        if (result.req_body_type === "form") {
          resBody = result.req_body_form;
          compileType = "form";
        } else {
          // json有两种，一种是res_body_is_json_schema为true，一种是false
          if (result.req_body_is_json_schema) {
            resBody = resBody.properties;
            compileType = "json_schema";
          }
        }
      } else if (type === "queryBtn") {
        interfaceName += "Query";
        compileType = "query";
      }

      const value = this.toTsCompile.compile(
        resBody,
        interfaceName,
        compileType,
        title
      );

      // 是否需要之前的数据
      if (isAnd) {
        copy(this.prevValue + value);
        element.innerText = innerText;
      } else {
        copy(value);
        element.innerText = btnType[type].innerText;
      }

      this.prevValue = this.prevValue + value;
      message({ text: "复制成功", type: "success" });
    } catch (err) {
      console.error(err);
      this.prevValue = "";
      if (isAnd) {
        element.innerText = innerText;
      } else {
        element.innerText = btnType[type].innerText;
      }
      message({
        text: `生成失败, 请检查是否有${btnType[type].innerText}`,
        type: "error",
      });
    }
  }
}
