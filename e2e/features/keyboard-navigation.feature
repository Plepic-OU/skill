Feature: Keyboard navigation

  Scenario: Navigate and expand nodes with keyboard
    Given I open the skill tree page
    When I focus the first skill node
    And I press Enter
    Then the node detail should be visible
