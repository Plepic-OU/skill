Feature: Keyboard navigation

  Scenario: Navigate and expand nodes with keyboard
    Given I open the skill tree page
    When I focus the first skill node
    And I press Enter
    Then the node detail should be visible

  Scenario Outline: Claim a level with the keyboard
    Given I open the skill tree page
    When I focus the "Review Every Edit" node
    And I press Enter
    And I press Tab
    Then the "This is me" action should have focus
    When I press <key>
    Then the "Review Every Edit" node should be claimed
    And the "Step back one" action should have focus

    Examples:
      | key   |
      | Enter |
      | Space |

  Scenario: Tab skips the actions of collapsed levels
    Given I open the skill tree page
    When I focus the "Autocomplete" node
    And I press Tab
    Then the "Review Every Edit" node header should have focus
