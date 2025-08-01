import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import React from "react";
import NewNoteForm from "../components/NewNoteForm";

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

describe("Note Privacy Features", () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();
  const mockCommunities = [
    { id: "1", name: "Test Community", visibility: "public" },
    { id: "2", name: "Private Community", visibility: "private" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows privacy selector for personal notes only", async () => {
    render(
      <BrowserRouter>
        <NewNoteForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          loading={false}
          error=""
          communities={mockCommunities}
          showCommunitySelector={true}
        />
      </BrowserRouter>
    );

    // Initially privacy selector should be visible
    expect(screen.getByText(/Privacy della nota/)).toBeInTheDocument();

    // Select a community
    const communitySelect = screen.getByRole("combobox");
    fireEvent.change(communitySelect, { target: { value: "1" } });

    // Now privacy selector should not be visible when community is selected
    await waitFor(() => {
      expect(screen.queryByText(/Privacy della nota/)).not.toBeInTheDocument();
    });
  });

  it("displays privacy options when creating personal notes", () => {
    render(
      <BrowserRouter>
        <NewNoteForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          loading={false}
          error=""
          communities={mockCommunities}
          showCommunitySelector={false}
        />
      </BrowserRouter>
    );

    // Privacy selector should be visible for personal notes
    expect(screen.getByText(/Privacy della nota/)).toBeInTheDocument();
    expect(
      screen.getByText(/🌍 Pubblica - Visibile a tutti gli utenti/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/🔒 Privata - Visibile solo a te/)
    ).toBeInTheDocument();
  });

  it("shows privacy info when private option is selected", async () => {
    render(
      <BrowserRouter>
        <NewNoteForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          loading={false}
          error=""
          communities={mockCommunities}
          showCommunitySelector={false}
        />
      </BrowserRouter>
    );

    // Select private option
    const privateRadio = screen.getByDisplayValue("private");
    fireEvent.click(privateRadio);

    await waitFor(() => {
      expect(
        screen.getByText(/Le note private sono visibili solo a te/)
      ).toBeInTheDocument();
    });
  });

  it("defaults to public privacy for personal notes", () => {
    render(
      <BrowserRouter>
        <NewNoteForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          loading={false}
          error=""
          communities={mockCommunities}
          showCommunitySelector={false}
        />
      </BrowserRouter>
    );

    const publicRadio = screen.getByDisplayValue("public");
    expect(publicRadio).toBeChecked();

    const privateRadio = screen.getByDisplayValue("private");
    expect(privateRadio).not.toBeChecked();
  });

  it("switches between privacy options correctly", async () => {
    render(
      <BrowserRouter>
        <NewNoteForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          loading={false}
          error=""
          communities={mockCommunities}
          showCommunitySelector={false}
        />
      </BrowserRouter>
    );

    const publicRadio = screen.getByDisplayValue("public");
    const privateRadio = screen.getByDisplayValue("private");

    // Initially public should be selected
    expect(publicRadio).toBeChecked();
    expect(privateRadio).not.toBeChecked();

    // Click private
    fireEvent.click(privateRadio);
    await waitFor(() => {
      expect(privateRadio).toBeChecked();
      expect(publicRadio).not.toBeChecked();
    });

    // Click public again
    fireEvent.click(publicRadio);
    await waitFor(() => {
      expect(publicRadio).toBeChecked();
      expect(privateRadio).not.toBeChecked();
    });
  });

  it("includes privacy setting in form submission", async () => {
    render(
      <BrowserRouter>
        <NewNoteForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          loading={false}
          error=""
          communities={mockCommunities}
          showCommunitySelector={false}
        />
      </BrowserRouter>
    );

    // Add a field
    const addFieldButton = screen.getByText("Aggiungi Campo");
    fireEvent.click(addFieldButton);

    // Fill in field - get the last empty field that was just added
    const nameInputs = screen.getAllByPlaceholderText(
      "Nome campo (es. Titolo)"
    );
    const valueInputs = screen.getAllByPlaceholderText("Valore campo");

    const nameInput = nameInputs[nameInputs.length - 1]; // Last field added
    const valueInput = valueInputs[valueInputs.length - 1]; // Last field added

    fireEvent.change(nameInput, { target: { value: "Test Field" } });
    fireEvent.change(valueInput, { target: { value: "Test Value" } });

    // Select private
    const privateRadio = screen.getByDisplayValue("private");
    fireEvent.click(privateRadio);

    // Submit form
    const submitButton = screen.getByText("Salva Nota");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: "Test Field",
            value: "Test Value",
          }),
        ]),
        "", // selectedCommunityId (empty for personal notes)
        expect.objectContaining({
          type: "self",
          name: "",
          revealPseudonym: false,
        }),
        true // isPrivate = true
      );
    });
  });

  it("submits with public privacy by default", async () => {
    render(
      <BrowserRouter>
        <NewNoteForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          loading={false}
          error=""
          communities={mockCommunities}
          showCommunitySelector={false}
        />
      </BrowserRouter>
    );

    // Add a field
    const addFieldButton = screen.getByText("Aggiungi Campo");
    fireEvent.click(addFieldButton);

    // Fill in field - get the last empty field that was just added
    const nameInputs = screen.getAllByPlaceholderText(
      "Nome campo (es. Titolo)"
    );
    const valueInputs = screen.getAllByPlaceholderText("Valore campo");

    const nameInput = nameInputs[nameInputs.length - 1]; // Last field added
    const valueInput = valueInputs[valueInputs.length - 1]; // Last field added

    fireEvent.change(nameInput, { target: { value: "Test Field" } });
    fireEvent.change(valueInput, { target: { value: "Test Value" } });

    // Submit form without changing privacy (should default to public)
    const submitButton = screen.getByText("Salva Nota");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: "Test Field",
            value: "Test Value",
          }),
        ]),
        "", // selectedCommunityId (empty for personal notes)
        expect.objectContaining({
          type: "self",
          name: "",
          revealPseudonym: false,
        }),
        false // isPrivate = false (public)
      );
    });
  });
});
