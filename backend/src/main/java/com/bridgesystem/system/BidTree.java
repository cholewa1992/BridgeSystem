package com.bridgesystem.system;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.Objects;

public final class BidTree {

    static final String EMPTY_JSON = "{\"children\":[]}";

    private final JsonNode root;

    private BidTree(JsonNode root) {
        this.root = Objects.requireNonNull(root, "root");
    }

    public static BidTree empty(com.fasterxml.jackson.databind.ObjectMapper mapper) {
        try {
            return new BidTree(mapper.readTree(EMPTY_JSON));
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new IllegalStateException("Failed to parse empty tree", e);
        }
    }

    public static BidTree from(JsonNode root) {
        Objects.requireNonNull(root, "root");
        if (!root.has("children")) {
            throw new IllegalArgumentException("Bid tree must have a 'children' field");
        }
        return new BidTree(root);
    }

    public JsonNode root() {
        return root;
    }

    public String toJson(com.fasterxml.jackson.databind.ObjectMapper mapper) {
        try {
            return mapper.writeValueAsString(root);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize tree", e);
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof BidTree bt)) return false;
        return root.equals(bt.root);
    }

    @Override
    public int hashCode() {
        return root.hashCode();
    }
}
