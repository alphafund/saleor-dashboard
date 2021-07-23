/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: SearchGiftCardTags
// ====================================================

export interface SearchGiftCardTags_search_edges_node {
  __typename: "GiftCard";
  id: string;
  tag: string | null;
}

export interface SearchGiftCardTags_search_edges {
  __typename: "GiftCardCountableEdge";
  node: SearchGiftCardTags_search_edges_node;
}

export interface SearchGiftCardTags_search_pageInfo {
  __typename: "PageInfo";
  endCursor: string | null;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
}

export interface SearchGiftCardTags_search {
  __typename: "GiftCardCountableConnection";
  totalCount: number | null;
  edges: SearchGiftCardTags_search_edges[];
  pageInfo: SearchGiftCardTags_search_pageInfo;
}

export interface SearchGiftCardTags {
  search: SearchGiftCardTags_search | null;
}

export interface SearchGiftCardTagsVariables {
  query: string;
  first: number;
  after?: string | null;
  last?: number | null;
  before?: string | null;
}
