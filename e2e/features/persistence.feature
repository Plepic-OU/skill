Feature: State persistence

  Scenario: Progress survives page reload
    Given I open the skill tree page
    And I expand the "Review Every Edit" node
    And I click "This is me"
    When I reload the page
    Then the "Review Every Edit" node should be claimed

  Scenario: Safety zone survives page reload
    Given I open the skill tree page
    And I click the "Normal" safety zone button
    When I reload the page
    Then the "Normal" button should be active
