// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React from "react";
import { render, screen } from "@testing-library/react";

import { metadata } from "__support__/sample_database_fixture";

import Question from "metabase-lib/lib/Question";
import Field from "metabase-lib/lib/metadata/Field";
import Filter from "metabase-lib/lib/queries/structured/Filter";

import BooleanPicker, { BooleanPickerCheckbox } from "./index";

const booleanField = new Field({
  database_type: "bool",
  semantic_type: "type/Category",
  table_id: 8,
  name: "bool",
  has_field_values: "list",
  dimensions: {},
  dimension_options: [],
  effective_type: "type/Boolean",
  id: 134,
  base_type: "type/Boolean",
  metadata,
});

const card = {
  dataset_query: {
    database: 5,
    query: {
      "source-table": 8,
      filter: ["=", ["field", 134, null], true],
    },
    type: "query",
  },
  display: "table",
  visualization_settings: {},
};

metadata.fields[booleanField.id] = booleanField;

const question = new Question(card, metadata);

const fieldRef = ["field", 134, null];
const filters = {
  true: new Filter(["=", fieldRef, true], null, question.query()),
  false: new Filter(["=", fieldRef, false], null, question.query()),
  empty: new Filter(["is-null", fieldRef], null, question.query()),
  "not empty": new Filter(["not-null", fieldRef], null, question.query()),
};

const invalidFilter = new Filter(["=", fieldRef], question.query());

const mockOnFilterChange = jest.fn();
function setup(filter) {
  mockOnFilterChange.mockReset();
  return render(
    <BooleanPicker filter={filter} onFilterChange={mockOnFilterChange} />,
  );
}

describe("BooleanPicker", () => {
  describe("BooleanPickerRadio", () => {
    it("should hide empty options when empty options are not selected", () => {
      setup(filters.true);

      expect(screen.queryByLabelText("empty")).toBeNull();
      expect(screen.queryByLabelText("not empty")).toBeNull();

      screen.getByText("More options").click();

      expect(screen.getByLabelText("empty")).toBeInTheDocument();
      expect(screen.getByLabelText("not empty")).toBeInTheDocument();
    });

    it("should show empty options when given an empty filter", () => {
      setup(filters.empty);

      const option = screen.getByLabelText("empty");
      expect(option.checked).toBe(true);

      expect(screen.getByLabelText("not empty")).toBeInTheDocument();
    });

    Object.entries(filters).forEach(([label, filter]) => {
      it(`should have the "${label}" option selected when given the associated filter`, () => {
        setup(filter);

        const option = screen.getByLabelText(label);
        expect(option.checked).toBe(true);
      });

      it(`should correctly update the filter for the "${label}" option when it is selected`, () => {
        setup(label === "true" ? filters.false : filters.true);

        screen.getByText("More options").click();

        screen.getByLabelText(label).click();
        expect(mockOnFilterChange).toHaveBeenCalled();
        const newFilter = mockOnFilterChange.mock.calls[0][0];

        expect(newFilter.raw()).toEqual(filter.raw());
      });
    });
  });

  describe("BooleanPickerCheckbox", () => {
    it("should render a true checkbox", () => {
      render(
        <BooleanPickerCheckbox
          filter={filters.true}
          onFilterChange={mockOnFilterChange}
        />,
      );
      expect(screen.getByLabelText("true").checked).toBe(true);
      expect(screen.getByLabelText("false").checked).toBe(false);
    });
    it("should render a false checkbox", () => {
      render(
        <BooleanPickerCheckbox
          filter={filters.false}
          onFilterChange={mockOnFilterChange}
        />,
      );
      expect(screen.getByLabelText("true").checked).toBe(false);
      expect(screen.getByLabelText("false").checked).toBe(true);
    });

    it("should render indeterminate checkboxes", () => {
      render(
        <BooleanPickerCheckbox
          filter={filters.empty}
          onFilterChange={mockOnFilterChange}
        />,
      );

      screen.getAllByRole("img").forEach(el => {
        expect(el.classList).toContain("Icon-dash");
      });
    });

    it("should toggle between true and false states", () => {
      mockOnFilterChange.mockReset();
      render(
        <BooleanPickerCheckbox
          filter={filters.true}
          onFilterChange={mockOnFilterChange}
        />,
      );

      screen.getByText("false").click();

      const newFilter = mockOnFilterChange.mock.calls[0][0];
      expect(newFilter.raw()).toEqual(filters.false.raw());
    });

    it("should remove true/false filter on deselect", () => {
      mockOnFilterChange.mockReset();
      render(
        <BooleanPickerCheckbox
          filter={filters.true}
          onFilterChange={mockOnFilterChange}
        />,
      );

      screen.getByText("true").click();

      const newFilter = mockOnFilterChange.mock.calls[0][0];
      expect(newFilter.raw()).toEqual(invalidFilter.raw());
    });
  });
});
