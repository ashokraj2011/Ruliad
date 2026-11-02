# Order discount threshold

## Outcome

The 10 percent order discount applies only to orders strictly above INR 5000.00.

## Actors

- Shopper: places INR orders.

## User scenarios

1. A shopper with an INR 6000.00 cart sees a 10 percent discount.

## Scope

In scope: the order discount rule. Out of scope: tax and shipping.

## Requirements

WHEN an INR order total is strictly greater than INR 5000.00, the cart SHALL apply a 10 percent order discount. [SPEC-CHK-004:REQ-001]

WHEN a cart is not in INR, the cart SHALL apply no order discount. [SPEC-CHK-004:REQ-002]

## Acceptance

An INR 5000.01 cart gets INR 500.00 off, as SPEC-CHK-004:REQ-001 states. [SPEC-CHK-004:AC-001]

A USD cart of 6000.00 gets nothing off, as SPEC-CHK-004:REQ-002 states. [SPEC-CHK-004:AC-002]

## Decisions and open questions

- None.
