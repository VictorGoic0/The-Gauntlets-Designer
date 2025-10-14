import { describe, it, expect } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { CanvasProvider } from "../CanvasContext";
import { useCanvas } from "../../hooks/useCanvas";

// Test component that uses the canvas context
function TestComponent() {
  const context = useCanvas();

  return (
    <div>
      <div data-testid="stage-position">
        {context.stagePosition.x},{context.stagePosition.y}
      </div>
      <div data-testid="stage-scale">{context.stageScale}</div>
      <div data-testid="canvas-mode">{context.canvasMode}</div>
      <div data-testid="selected-objects">
        {context.selectedObjectIds.join(",")}
      </div>
      <div data-testid="min-scale">{context.MIN_SCALE}</div>
      <div data-testid="max-scale">{context.MAX_SCALE}</div>

      <button onClick={() => context.setStagePosition({ x: 100, y: 200 })}>
        Set Position
      </button>
      <button onClick={() => context.setStageScale(2)}>Set Scale</button>
      <button onClick={() => context.setCanvasMode("rectangle")}>
        Set Mode Rectangle
      </button>
      <button onClick={() => context.setCanvasMode("select")}>
        Set Mode Select
      </button>
      <button onClick={() => context.selectObject("obj1")}>
        Select Object 1
      </button>
      <button onClick={() => context.addToSelection("obj2")}>
        Add Object 2
      </button>
      <button onClick={() => context.deselectObject("obj1")}>
        Deselect Object 1
      </button>
      <button onClick={() => context.clearSelection()}>Clear Selection</button>
    </div>
  );
}

const renderWithProvider = () => {
  return render(
    <CanvasProvider>
      <TestComponent />
    </CanvasProvider>
  );
};

describe("CanvasContext - Zoom/Pan State Management", () => {
  it("should provide initial pan position of (0, 0)", () => {
    renderWithProvider();
    expect(screen.getByTestId("stage-position")).toHaveTextContent("0,0");
  });

  it("should provide initial zoom scale of 1", () => {
    renderWithProvider();
    expect(screen.getByTestId("stage-scale")).toHaveTextContent("1");
  });

  it("should provide MIN_SCALE constant of 0.1", () => {
    renderWithProvider();
    expect(screen.getByTestId("min-scale")).toHaveTextContent("0.1");
  });

  it("should provide MAX_SCALE constant of 5", () => {
    renderWithProvider();
    expect(screen.getByTestId("max-scale")).toHaveTextContent("5");
  });

  it("should update stage position when setStagePosition is called", () => {
    renderWithProvider();
    const button = screen.getByText("Set Position");

    act(() => {
      button.click();
    });

    expect(screen.getByTestId("stage-position")).toHaveTextContent("100,200");
  });

  it("should update stage scale when setStageScale is called", () => {
    renderWithProvider();
    const button = screen.getByText("Set Scale");

    act(() => {
      button.click();
    });

    expect(screen.getByTestId("stage-scale")).toHaveTextContent("2");
  });
});

describe("CanvasContext - Canvas Mode Switching", () => {
  it("should provide initial canvas mode of 'select'", () => {
    renderWithProvider();
    expect(screen.getByTestId("canvas-mode")).toHaveTextContent("select");
  });

  it("should switch canvas mode to 'rectangle'", () => {
    renderWithProvider();
    const button = screen.getByText("Set Mode Rectangle");

    act(() => {
      button.click();
    });

    expect(screen.getByTestId("canvas-mode")).toHaveTextContent("rectangle");
  });

  it("should switch canvas mode back to 'select'", () => {
    renderWithProvider();
    const rectangleButton = screen.getByText("Set Mode Rectangle");
    const selectButton = screen.getByText("Set Mode Select");

    act(() => {
      rectangleButton.click();
    });

    expect(screen.getByTestId("canvas-mode")).toHaveTextContent("rectangle");

    act(() => {
      selectButton.click();
    });

    expect(screen.getByTestId("canvas-mode")).toHaveTextContent("select");
  });
});

describe("CanvasContext - Selection Management", () => {
  it("should provide initial empty selection", () => {
    renderWithProvider();
    expect(screen.getByTestId("selected-objects")).toHaveTextContent("");
  });

  it("should select an object with selectObject", () => {
    renderWithProvider();
    const button = screen.getByText("Select Object 1");

    act(() => {
      button.click();
    });

    expect(screen.getByTestId("selected-objects")).toHaveTextContent("obj1");
  });

  it("should add object to selection with addToSelection", () => {
    renderWithProvider();
    const selectButton = screen.getByText("Select Object 1");
    const addButton = screen.getByText("Add Object 2");

    act(() => {
      selectButton.click();
    });

    act(() => {
      addButton.click();
    });

    expect(screen.getByTestId("selected-objects")).toHaveTextContent(
      "obj1,obj2"
    );
  });

  it("should not add duplicate object to selection", () => {
    renderWithProvider();
    const selectButton = screen.getByText("Select Object 1");

    act(() => {
      selectButton.click();
    });

    act(() => {
      selectButton.click();
    });

    // Should only have obj1 once
    expect(screen.getByTestId("selected-objects")).toHaveTextContent("obj1");
  });

  it("should deselect object with deselectObject", () => {
    renderWithProvider();
    const selectButton = screen.getByText("Select Object 1");
    const deselectButton = screen.getByText("Deselect Object 1");

    act(() => {
      selectButton.click();
    });

    expect(screen.getByTestId("selected-objects")).toHaveTextContent("obj1");

    act(() => {
      deselectButton.click();
    });

    expect(screen.getByTestId("selected-objects")).toHaveTextContent("");
  });

  it("should clear all selections with clearSelection", () => {
    renderWithProvider();
    const select1Button = screen.getByText("Select Object 1");
    const add2Button = screen.getByText("Add Object 2");
    const clearButton = screen.getByText("Clear Selection");

    act(() => {
      select1Button.click();
    });

    act(() => {
      add2Button.click();
    });

    expect(screen.getByTestId("selected-objects")).toHaveTextContent(
      "obj1,obj2"
    );

    act(() => {
      clearButton.click();
    });

    expect(screen.getByTestId("selected-objects")).toHaveTextContent("");
  });

  it("should replace selection when selectObject is called with existing selection", () => {
    renderWithProvider();
    const select1Button = screen.getByText("Select Object 1");
    const add2Button = screen.getByText("Add Object 2");

    act(() => {
      select1Button.click();
    });

    expect(screen.getByTestId("selected-objects")).toHaveTextContent("obj1");

    act(() => {
      add2Button.click();
    });

    expect(screen.getByTestId("selected-objects")).toHaveTextContent(
      "obj1,obj2"
    );

    // Selecting obj1 again should replace the entire selection with just obj1
    act(() => {
      select1Button.click();
    });

    expect(screen.getByTestId("selected-objects")).toHaveTextContent("obj1");
  });
});

