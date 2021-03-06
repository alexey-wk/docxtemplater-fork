"use strict";

var _require = require("./utils"),
    createDoc = _require.createDoc,
    expect = _require.expect,
    createXmlTemplaterDocxNoRender = _require.createXmlTemplaterDocxNoRender;

var _require2 = require("lodash"),
    times = _require2.times;

var inspectModule = require("../inspect-module.js");

describe("Speed test", function () {
  it("should be fast for simple tags", function () {
    var content = "<w:t>tag {age}</w:t>";
    var docs = [];

    for (var i = 0; i < 100; i++) {
      docs.push(createXmlTemplaterDocxNoRender(content, {
        tags: {
          age: 12
        }
      }));
    }

    var time = new Date();

    for (var _i = 0; _i < 100; _i++) {
      docs[_i].render();
    }

    var duration = new Date() - time;
    expect(duration).to.be.below(400);
  });
  it("should be fast for simple tags with huge content", function () {
    var content = "<w:t>tag {age}</w:t>";
    var i;
    var result = [];

    for (i = 1; i <= 10000; i++) {
      result.push("bla");
    }

    var prepost = result.join("");
    content = prepost + content + prepost;
    var docs = [];

    for (i = 0; i < 20; i++) {
      docs.push(createXmlTemplaterDocxNoRender(content, {
        tags: {
          age: 12
        }
      }));
    }

    var time = new Date();

    for (i = 0; i < 20; i++) {
      docs[i].render();
    }

    var duration = new Date() - time;
    expect(duration).to.be.below(400);
  });
  it("should be fast for loop tags", function () {
    var content = "<w:t>{#users}{name}{/users}</w:t>";
    var users = [];

    for (var i = 1; i <= 1000; i++) {
      users.push({
        name: "foo"
      });
    }

    var doc = createXmlTemplaterDocxNoRender(content, {
      tags: {
        users: users
      }
    });
    var time = new Date();
    doc.render();
    var duration = new Date() - time;
    expect(duration).to.be.below(100);
  });
  it("should be fast for nested loop tags", function () {
    var result = [];

    for (var i = 1; i <= 300; i++) {
      result.push("\n\t\t<w:proofErr w:type=\"spellEnd\"/>\n\t\t<w:r w:rsidRPr=\"0000000\">\n\t\t<w:rPr>\n\t\t<w:rFonts w:asciiTheme=\"minorHAnsi\" w:eastAsia=\"Times New Roman\" w:hAnsiTheme=\"minorHAnsi\" w:cs=\"Arial\"/>\n\t\t<w:sz w:val=\"22\"/>\n\t\t<w:szCs w:val=\"22\"/>\n\t\t<w:lang w:eastAsia=\"es-ES\"/>\n\t\t</w:rPr>\n\t\t<w:t xml:space=\"preserve\">{#users} Names : {user}</w:t>\n\t\t<w:t xml:space=\"preserve\">{/}</w:t>\n\t\t</w:r>\n\t\t");
    }

    var prepost = result.join("");
    var content = "<w:p><w:r><w:t>{#foo}</w:t></w:r>".concat(prepost, "<w:r><w:t>{/}</w:t></w:r></w:p>");
    var users = [{
      name: "John"
    }, {
      name: "Mary"
    }];
    var doc = createXmlTemplaterDocxNoRender(content, {
      tags: {
        users: users
      }
    });
    var time = new Date();
    doc.render();
    var duration = new Date() - time;
    expect(duration).to.be.below(250);
  });
  /* eslint-disable-next-line no-process-env */

  if (!process.env.FAST) {
    it("should not exceed call stack size for big document with rawxml", function () {
      this.timeout(30000);
      var result = [];
      var normalContent = "<w:p><w:r><w:t>foo</w:t></w:r></w:p>";
      var rawContent = "<w:p><w:r><w:t>{@raw}</w:t></w:r></w:p>";

      for (var i = 1; i <= 30000; i++) {
        if (i % 100 === 1) {
          result.push(rawContent);
        }

        result.push(normalContent);
      }

      var content = result.join("");
      var users = [];
      var doc = createXmlTemplaterDocxNoRender(content, {
        tags: {
          users: users
        }
      });
      var now = new Date();
      doc.compile();
      var compileDuration = new Date() - now;

      if (typeof window === "undefined") {
        // Skip this assertion in the browser
        expect(compileDuration).to.be.below(7000);
      }

      now = new Date();
      doc.render();
      var duration = new Date() - now;
      expect(duration).to.be.below(25000);
    });
    describe("Inspect module", function () {
      it("should not be slow after multiple generations", function () {
        var duration = 0;
        var iModule = inspectModule();

        for (var i = 0; i < 10; i++) {
          var doc = createDoc("tag-product-loop.docx");
          var startTime = new Date();
          doc.attachModule(iModule);
          var data = {
            nom: "Doe",
            prenom: "John",
            telephone: "0652455478",
            description: "New Website",
            offre: times(20000, function (i) {
              return {
                prix: 1000 + i,
                nom: "Acme" + i
              };
            })
          };
          doc.setData(data);
          doc.compile();
          doc.render();
          duration += new Date() - startTime;
        }

        expect(duration).to.be.below(750);
      });
    });
  }
});