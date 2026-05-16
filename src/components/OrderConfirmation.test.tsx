import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import OrderConfirmation from "./OrderConfirmation";

describe("OrderConfirmation", () => {
  it("does not render when closed", () => {
    const { container } = render(
      <OrderConfirmation
        isOpen={false}
        onClose={vi.fn()}
        productTitle="Kurta"
        productPrice={999}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders order details and closes on action", () => {
    const onClose = vi.fn();

    render(
      <OrderConfirmation
        isOpen
        onClose={onClose}
        productTitle="Kurta"
        productPrice={999}
        sellerName="Apna Seller"
        sellerContact="+91 9999999999"
      />,
    );

    expect(screen.getByText("Order Placed!")).toBeInTheDocument();
    expect(screen.getByText("Kurta")).toBeInTheDocument();
    expect(screen.getByText("₹999")).toBeInTheDocument();
    expect(screen.getByText("Apna Seller")).toBeInTheDocument();
    expect(screen.getByText(/\+91 9999999999/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /continue shopping/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
